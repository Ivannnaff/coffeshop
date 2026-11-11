<?php

declare(strict_types=1);

namespace App\Domain\Order;

use App\Domain\Order\Exceptions\InvalidOrderTransitionException;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;

class OrderStateMachine
{
    /**
     * Memeriksa apakah transisi status diizinkan.
     * Lihat 04-BUSINESS-RULES.md bagian 1.3 dan 1.4.
     */
    public function canTransition(OrderStatus $from, OrderStatus $to, OrderMode $mode, StatusActorType $actorType): bool
    {
        // Status final tidak boleh berubah lagi.
        if ($from->isFinal()) {
            return false;
        }

        return match ($from) {
            OrderStatus::PendingPayment => match ($to) {
                OrderStatus::Paid => $actorType === StatusActorType::Webhook,
                OrderStatus::Expired => $actorType === StatusActorType::System,
                default => false,
            },
            OrderStatus::Paid => $to === OrderStatus::Preparing && $actorType === StatusActorType::User,
            OrderStatus::Preparing => $to === OrderStatus::Ready && $actorType === StatusActorType::User,
            OrderStatus::Ready => $actorType === StatusActorType::User && (
                $mode->supportsOutForDelivery()
                    ? $to === OrderStatus::OutForDelivery
                    : $to === OrderStatus::Completed
            ),
            OrderStatus::OutForDelivery => $to === OrderStatus::Completed
                && $mode->supportsOutForDelivery()
                && $actorType === StatusActorType::User,
            OrderStatus::Completed, OrderStatus::Expired => false,
        };
    }

    /**
     * Validasi transisi dan lempar exception bila tidak diizinkan.
     */
    public function assertCanTransition(OrderStatus $from, OrderStatus $to, OrderMode $mode, StatusActorType $actorType): void
    {
        if (! $this->canTransition($from, $to, $mode, $actorType)) {
            throw InvalidOrderTransitionException::because($from->value, $to->value);
        }
    }
}
