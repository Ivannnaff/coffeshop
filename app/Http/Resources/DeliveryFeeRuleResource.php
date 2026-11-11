<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\DeliveryFeeRule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DeliveryFeeRule
 */
class DeliveryFeeRuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var DeliveryFeeRule $rule */
        $rule = $this->resource;

        return [
            'id' => $rule->id,
            'delivery_zone_id' => $rule->delivery_zone_id,
            'min_eligible_subtotal' => $rule->min_eligible_subtotal,
            'discount_type' => $rule->discount_type->value,
            'discount_value' => $rule->discount_value,
            'is_active' => $rule->is_active,
        ];
    }
}
