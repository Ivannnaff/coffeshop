<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Events\OrderPaid;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

class RealtimeBroadcastFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $barista;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();

        $this->travelTo(Carbon::create(2026, 11, 10, 10, 0, 0, 'Asia/Jakarta'));

        StoreSetting::create([
            'store_id' => 1,
            'name' => 'Menanti Coffee',
            'timezone' => 'Asia/Jakarta',
            'is_accepting_orders' => true,
        ]);

        $this->barista = User::create([
            'name' => 'Barista User',
            'email' => 'barista@menanti.test',
            'password' => bcrypt('password12345'),
            'role' => Role::Barista,
            'is_active' => true,
        ]);
    }

    public function test_order_paid_and_status_changed_events_are_dispatched(): void
    {
        Event::fake([OrderPaid::class, OrderStatusChanged::class]);

        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-8888',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::Paid,
            'customer_name' => 'Dani',
            'customer_phone' => '081234567899',
            'subtotal' => 20000,
            'eligible_subtotal' => 20000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 20000,
            'min_item_price_snapshot' => 15000,
            'paid_at' => now(),
            'expires_at' => now()->addMinutes(15),
        ]);

        $this->actingAs($this->barista);

        $response = $this->postJson("/kds/orders/{$order->id}/start", [
            'note' => 'Mulai meracik',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'PREPARING');

        // Pastikan event OrderStatusChanged di-dispatch
        Event::assertDispatched(OrderStatusChanged::class, function ($event) use ($order) {
            return $event->order->id === $order->id
                && $event->fromStatus === OrderStatus::Paid
                && $event->toStatus === OrderStatus::Preparing;
        });
    }

    public function test_kds_channel_authorization(): void
    {
        $this->actingAs($this->barista);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => 'private-kds.store.1',
            'socket_id' => '123.456',
        ]);

        $response->assertOk();
    }
}
