<?php

declare(strict_types=1);

namespace App\Domain\Delivery\DTO;

final readonly class DeliveryQuote
{
    public function __construct(
        public int $zoneId,
        public string $zoneName,
        public float $distanceKm,
        public int $baseFee,
        public int $deliveryDiscount,
        public int $deliveryFee,
    ) {}
}
