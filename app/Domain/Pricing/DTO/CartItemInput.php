<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

final readonly class CartItemInput
{
    /**
     * @param  list<VariantChoice>  $variants
     * @param  list<AddonChoice>  $addons
     * @param  list<AddonGroupRule>  $addonGroups  Grup add-on yang terhubung ke produk.
     */
    public function __construct(
        public int $productId,
        public string $productName,
        public int $basePrice,
        public int $qty,
        public array $variants = [],
        public array $addons = [],
        public array $addonGroups = [],
        public int $promoDiscountPerUnit = 0,
        public bool $isActive = true,
        public bool $isSoldOut = false,
        public ?string $note = null,
        public ?int $cartItemId = null,
        public ?string $unavailableReason = null,
    ) {}
}
