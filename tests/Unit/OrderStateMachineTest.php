<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Order\Exceptions\InvalidOrderTransitionException;
use App\Domain\Order\OrderStateMachine;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class OrderStateMachineTest extends TestCase
{
    /**
     * Transisi yang diizinkan beserta aktornya (04-BUSINESS-RULES.md 1.3).
     *
     * @return array<string, array{OrderStatus, OrderStatus, OrderMode, StatusActorType}>
     */
    public static function allowedTransitions(): array
    {
        $user = StatusActorType::User;

        return [
            'pending -> paid (webhook)' => [OrderStatus::PendingPayment, OrderStatus::Paid, OrderMode::Takeaway, StatusActorType::Webhook],
            'pending -> expired (system)' => [OrderStatus::PendingPayment, OrderStatus::Expired, OrderMode::Takeaway, StatusActorType::System],
            'paid -> preparing' => [OrderStatus::Paid, OrderStatus::Preparing, OrderMode::DineIn, $user],
            'preparing -> ready' => [OrderStatus::Preparing, OrderStatus::Ready, OrderMode::DineIn, $user],
            'ready -> completed (dine-in)' => [OrderStatus::Ready, OrderStatus::Completed, OrderMode::DineIn, $user],
            'ready -> completed (takeaway)' => [OrderStatus::Ready, OrderStatus::Completed, OrderMode::Takeaway, $user],
            'ready -> out for delivery (delivery)' => [OrderStatus::Ready, OrderStatus::OutForDelivery, OrderMode::Delivery, $user],
            'out for delivery -> completed (delivery)' => [OrderStatus::OutForDelivery, OrderStatus::Completed, OrderMode::Delivery, $user],
        ];
    }

    /**
     * @param  array{OrderStatus, OrderStatus, OrderMode, StatusActorType}  $transition
     */
    #[DataProvider('allowedTransitions')]
    public function test_allowed_transitions_pass(
        OrderStatus $from,
        OrderStatus $to,
        OrderMode $mode,
        StatusActorType $actor
    ): void {
        $machine = new OrderStateMachine;

        $this->assertTrue($machine->canTransition($from, $to, $mode, $actor));
        $machine->assertCanTransition($from, $to, $mode, $actor);

        $this->addToAssertionCount(1);
    }

    public function test_every_other_status_pair_is_rejected(): void
    {
        $machine = new OrderStateMachine;

        $shared = [
            [OrderStatus::PendingPayment, OrderStatus::Paid, StatusActorType::Webhook],
            [OrderStatus::PendingPayment, OrderStatus::Expired, StatusActorType::System],
            [OrderStatus::Paid, OrderStatus::Preparing, StatusActorType::User],
            [OrderStatus::Preparing, OrderStatus::Ready, StatusActorType::User],
        ];

        $nonDelivery = [
            [OrderStatus::Ready, OrderStatus::Completed, StatusActorType::User],
        ];

        $deliveryOnly = [
            [OrderStatus::Ready, OrderStatus::OutForDelivery, StatusActorType::User],
            [OrderStatus::OutForDelivery, OrderStatus::Completed, StatusActorType::User],
        ];

        /** @var array<string, true> $allowed */
        $allowed = [];

        foreach (OrderMode::cases() as $mode) {
            $transitions = [...$shared];

            if ($mode->supportsOutForDelivery()) {
                $transitions = [...$transitions, ...$deliveryOnly];
            } else {
                $transitions = [...$transitions, ...$nonDelivery];
            }

            foreach ($transitions as [$from, $to, $actor]) {
                $allowed["{$from->value}|{$to->value}|{$mode->value}|{$actor->value}"] = true;
            }
        }

        foreach (OrderStatus::cases() as $from) {
            foreach (OrderStatus::cases() as $to) {
                foreach (OrderMode::cases() as $mode) {
                    foreach (StatusActorType::cases() as $actor) {
                        $key = "{$from->value}|{$to->value}|{$mode->value}|{$actor->value}";
                        $expected = isset($allowed[$key]);

                        $this->assertSame(
                            $expected,
                            $machine->canTransition($from, $to, $mode, $actor),
                            "Kombinasi {$key} tidak sesuai aturan."
                        );
                    }
                }
            }
        }
    }

    public function test_out_for_delivery_is_rejected_for_non_delivery_modes(): void
    {
        $machine = new OrderStateMachine;

        foreach ([OrderMode::DineIn, OrderMode::Takeaway] as $mode) {
            $this->assertFalse($machine->canTransition(
                OrderStatus::Ready,
                OrderStatus::OutForDelivery,
                $mode,
                StatusActorType::User
            ));

            $this->assertFalse($machine->canTransition(
                OrderStatus::OutForDelivery,
                OrderStatus::Completed,
                $mode,
                StatusActorType::User
            ));
        }
    }

    public function test_delivery_cannot_skip_out_for_delivery(): void
    {
        $machine = new OrderStateMachine;

        $this->assertFalse($machine->canTransition(
            OrderStatus::Ready,
            OrderStatus::Completed,
            OrderMode::Delivery,
            StatusActorType::User
        ));
    }

    public function test_final_statuses_reject_all_transitions(): void
    {
        $machine = new OrderStateMachine;

        foreach ([OrderStatus::Completed, OrderStatus::Expired] as $finalStatus) {
            foreach (OrderStatus::cases() as $target) {
                foreach (StatusActorType::cases() as $actor) {
                    $this->assertFalse($machine->canTransition(
                        $finalStatus,
                        $target,
                        OrderMode::Delivery,
                        $actor
                    ));
                }
            }
        }
    }

    public function test_payment_statuses_require_specific_actor(): void
    {
        $machine = new OrderStateMachine;

        $this->assertFalse($machine->canTransition(
            OrderStatus::PendingPayment,
            OrderStatus::Paid,
            OrderMode::Takeaway,
            StatusActorType::User
        ));

        $this->assertFalse($machine->canTransition(
            OrderStatus::PendingPayment,
            OrderStatus::Expired,
            OrderMode::Takeaway,
            StatusActorType::Webhook
        ));

        $this->assertFalse($machine->canTransition(
            OrderStatus::Paid,
            OrderStatus::Preparing,
            OrderMode::Takeaway,
            StatusActorType::System
        ));
    }

    public function test_assert_can_transition_throws_exception(): void
    {
        $this->expectException(InvalidOrderTransitionException::class);

        (new OrderStateMachine)->assertCanTransition(
            OrderStatus::Completed,
            OrderStatus::Preparing,
            OrderMode::Takeaway,
            StatusActorType::User
        );
    }
}
