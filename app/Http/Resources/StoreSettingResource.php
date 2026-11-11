<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StoreSetting
 */
class StoreSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var StoreSetting $settings */
        $settings = $this->resource;

        return [
            'id' => $settings->id,
            'store_id' => $settings->store_id,
            'name' => $settings->name,
            'address' => $settings->address,
            'latitude' => $settings->latitude,
            'longitude' => $settings->longitude,
            'opening_time' => $settings->opening_time,
            'closing_time' => $settings->closing_time,
            'timezone' => $settings->timezone,
            'is_accepting_orders' => $settings->is_accepting_orders,
            'payment_expiry_minutes' => $settings->payment_expiry_minutes,
            'delivery_min_item_price' => $settings->delivery_min_item_price,
        ];
    }
}
