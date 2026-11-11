<?php

declare(strict_types=1);

namespace App\Domain\Delivery;

use App\Domain\Delivery\DTO\DeliveryFeeRuleDefinition;
use App\Domain\Delivery\DTO\DeliveryQuote;
use App\Domain\Delivery\DTO\DeliveryZoneItem;
use App\Enums\DeliveryDiscountType;

/**
 * Menghitung ongkir dan potongan ongkir sesuai 04-BUSINESS-RULES.md bagian 4.3.
 */
final class DeliveryFeeCalculator
{
    public function quote(DeliveryZoneItem $zone, float $distanceKm, int $eligibleSubtotal): DeliveryQuote
    {
        $baseFee = $zone->baseFee;
        $discount = 0;

        if ($zone->freeFeeMinSubtotal !== null && $eligibleSubtotal >= $zone->freeFeeMinSubtotal) {
            $discount = $baseFee;
        } else {
            $rule = $this->applicableRule($zone->rules, $eligibleSubtotal);

            if ($rule !== null) {
                $discount = match ($rule->discountType) {
                    DeliveryDiscountType::Free => $baseFee,
                    DeliveryDiscountType::Percent => $this->percentDiscount($baseFee, $rule->discountValue),
                };
            }
        }

        // Potongan tidak boleh melebihi ongkir.
        $deliveryDiscount = min($baseFee, $discount);

        return new DeliveryQuote(
            zoneId: $zone->id,
            zoneName: $zone->name,
            distanceKm: $distanceKm,
            baseFee: $baseFee,
            deliveryDiscount: $deliveryDiscount,
            deliveryFee: $baseFee - $deliveryDiscount,
        );
    }

    /**
     * Aturan dengan min_eligible_subtotal tertinggi yang terpenuhi.
     *
     * @param  list<DeliveryFeeRuleDefinition>  $rules
     */
    private function applicableRule(array $rules, int $eligibleSubtotal): ?DeliveryFeeRuleDefinition
    {
        $selected = null;

        foreach ($rules as $rule) {
            if (! $rule->isActive || $eligibleSubtotal < $rule->minEligibleSubtotal) {
                continue;
            }

            if ($selected === null || $rule->minEligibleSubtotal > $selected->minEligibleSubtotal) {
                $selected = $rule;
            }
        }

        return $selected;
    }

    private function percentDiscount(int $baseFee, ?int $discountValue): int
    {
        if ($discountValue === null || $discountValue <= 0) {
            return 0;
        }

        // Pembulatan ke bawah sesuai 04-BUSINESS-RULES.md bagian 4.3.
        return intdiv($baseFee * $discountValue, 100);
    }
}
