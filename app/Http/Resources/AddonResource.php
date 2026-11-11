<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Addon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Addon
 */
class AddonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Addon $addon */
        $addon = $this->resource;

        return [
            'id' => $addon->id,
            'addon_group_id' => $addon->addon_group_id,
            'name' => $addon->name,
            'price_delta' => $addon->price_delta,
            'is_sold_out' => $addon->is_sold_out,
            'is_active' => $addon->is_active,
            'sort_order' => $addon->sort_order,
        ];
    }
}
