<?php

declare(strict_types=1);

namespace App\Services\Checkout\DTO;

use App\Domain\Pricing\DTO\PricingResult;

final readonly class CheckoutPreview
{
    public function __construct(
        public PricingResult $pricing,
        public int $deliveryFee,
        public int $deliveryDiscount,
        public int $total,
        public ?int $zoneId,
        public ?string $zoneName,
        public ?float $distanceKm,
        public int $minItemPrice,
    ) {}
}
