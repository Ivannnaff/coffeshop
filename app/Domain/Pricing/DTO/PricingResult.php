<?php

declare(strict_types=1);

namespace App\Domain\Pricing\DTO;

final readonly class PricingResult
{
    /**
     * @param  list<PricedItem>  $items
     * @param  list<string>  $anomalies
     */
    public function __construct(
        public array $items,
        public int $subtotal,
        public int $eligibleSubtotal,
        public array $anomalies = [],
        public int $minItemPrice = 0,
    ) {}
}
