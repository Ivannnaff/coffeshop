<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\DeliveryZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DeliveryZone
 */
class DeliveryZoneResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var DeliveryZone $zone */
        $zone = $this->resource;

        return [
            'id' => $zone->id,
            'store_id' => $zone->store_id,
            'name' => $zone->name,
            'max_distance_km' => $zone->max_distance_km,
            'base_fee' => $zone->base_fee,
            'free_fee_min_subtotal' => $zone->free_fee_min_subtotal,
            'sort_order' => $zone->sort_order,
            'is_active' => $zone->is_active,
            'fee_rules' => DeliveryFeeRuleResource::collection($this->whenLoaded('feeRules')),
        ];
    }
}
