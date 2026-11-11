<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\AddonGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AddonGroup
 */
class AddonGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var AddonGroup $group */
        $group = $this->resource;

        return [
            'id' => $group->id,
            'name' => $group->name,
            'selection_type' => $group->selection_type->value,
            'min_select' => $group->min_select,
            'max_select' => $group->max_select,
            'is_active' => $group->is_active,
            'addons' => AddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
