<?php

declare(strict_types=1);

namespace App\Domain\Delivery\DTO;

final readonly class DeliveryZoneItem
{
    /**
     * @param  list<DeliveryFeeRuleDefinition>  $rules
     */
    public function __construct(
        public int $id,
        public string $name,
        public float $maxDistanceKm,
        public int $baseFee,
        public ?int $freeFeeMinSubtotal = null,
        public array $rules = [],
        public bool $isActive = true,
    ) {}
}
