<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Order\Exceptions\InvalidOrderTransitionException;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_transition_writes_status_log_and_paid_at(): void
    {
        $order = Order::factory()->create();

        /** @var OrderStatusService $service */
        $service = app(OrderStatusService::class);

        $updated = $service->transition(
            $order,
            OrderStatus::Paid,
            StatusActorType::Webhook,
            null,
            'Pembayaran sukses.'
        );

        $this->assertSame(OrderStatus::Paid, $updated->status);
        $this->assertNotNull($updated->paid_at);

        $this->assertDatabaseHas('order_status_logs', [
            'order_id' => $order->id,
            'from_status' => OrderStatus::PendingPayment->value,
            'to_status' => OrderStatus::Paid->value,
            'actor_type' => StatusActorType::Webhook->value,
            'note' => 'Pembayaran sukses.',
        ]);
    }

    public function test_transition_records_user_actor(): void
    {
        $barista = User::factory()->barista()->create();
        $order = Order::factory()->paid()->create();

        /** @var OrderStatusService $service */
        $service = app(OrderStatusService::class);

        $service->transition(
            $order,
            OrderStatus::Preparing,
            StatusActorType::User,
            $barista->id
        );

        $this->assertDatabaseHas('order_status_logs', [
            'order_id' => $order->id,
            'from_status' => OrderStatus::Paid->value,
            'to_status' => OrderStatus::Preparing->value,
            'actor_type' => StatusActorType::User->value,
            'actor_id' => $barista->id,
        ]);
    }

    public function test_invalid_transition_changes_nothing_and_writes_no_log(): void
    {
        $order = Order::factory()->create();

        /** @var OrderStatusService $service */
        $service = app(OrderStatusService::class);

        try {
            $service->transition($order, OrderStatus::Preparing, StatusActorType::User);
            $this->fail('Transisi tidak valid seharusnya melempar exception.');
        } catch (InvalidOrderTransitionException) {
            // expected
        }

        $this->assertSame(OrderStatus::PendingPayment, $order->fresh()->status);
        $this->assertDatabaseCount('order_status_logs', 0);
    }

    public function test_delivery_order_can_complete_with_out_for_delivery(): void
    {
        $order = Order::factory()->delivery()->paid()->create([
            'status' => OrderStatus::Ready->value,
        ]);

        /** @var OrderStatusService $service */
        $service = app(OrderStatusService::class);

        $service->transition($order, OrderStatus::OutForDelivery, StatusActorType::User);
        $completed = $service->transition($order, OrderStatus::Completed, StatusActorType::User);

        $this->assertSame(OrderStatus::Completed, $completed->status);
        $this->assertSame(OrderMode::Delivery, $completed->mode);
        $this->assertNotNull($completed->completed_at);
        $this->assertDatabaseCount('order_status_logs', 2);
    }

    public function test_final_status_cannot_change(): void
    {
        $order = Order::factory()->create([
            'status' => OrderStatus::Completed->value,
            'completed_at' => now(),
        ]);

        /** @var OrderStatusService $service */
        $service = app(OrderStatusService::class);

        $this->expectException(InvalidOrderTransitionException::class);

        $service->transition($order, OrderStatus::Preparing, StatusActorType::User);
    }
}
