<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

final readonly class PricedItem
{
    /**
     * @param  list<AddonChoice>  $addons
     */
    public function __construct(
        public int $productId,
        public string $productName,
        public ?string $sizeName,
        public ?string $temperatureName,
        public int $basePrice,
        public int $variantDelta,
        public int $addonsTotal,
        public int $discountAmount,
        public int $unitPrice,
        public int $qty,
        public int $lineTotal,
        public bool $isDeliveryEligible,
        public array $addons = [],
        public ?string $note = null,
        public bool $priceClamped = false,
        public ?int $cartItemId = null,
        public bool $isAvailable = true,
        public ?string $unavailableReason = null,
    ) {}
}
