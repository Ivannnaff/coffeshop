<?php

declare(strict_types=1);

namespace App\Services\Checkout\DTO;

use App\Enums\OrderMode;

final readonly class CheckoutInput
{
    public function __construct(
        public string $customerName,
        public string $customerPhone,
        public OrderMode $mode,
        public ?string $pickupNote = null,
        public ?string $deliveryAddress = null,
        public ?float $deliveryLatitude = null,
        public ?float $deliveryLongitude = null,
    ) {}
}
