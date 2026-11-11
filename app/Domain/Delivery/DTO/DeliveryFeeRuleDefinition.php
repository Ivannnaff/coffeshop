<?php

declare(strict_types=1);

namespace App\Domain\Delivery\DTO;

use App\Enums\DeliveryDiscountType;

final readonly class DeliveryFeeRuleDefinition
{
    public function __construct(
        public int $minEligibleSubtotal,
        public DeliveryDiscountType $discountType,
        public ?int $discountValue = null,
        public bool $isActive = true,
    ) {}
}
