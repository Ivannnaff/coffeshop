<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderMode: string
{
    case DineIn = 'dine_in';
    case Takeaway = 'takeaway';
    case Delivery = 'delivery';

    public function requiresDeliveryAddress(): bool
    {
        return $this === self::Delivery;
    }

    public function supportsOutForDelivery(): bool
    {
        return $this === self::Delivery;
    }
}
