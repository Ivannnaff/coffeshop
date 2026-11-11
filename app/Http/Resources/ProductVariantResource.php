<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductVariant
 */
class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ProductVariant $variant */
        $variant = $this->resource;

        return [
            'id' => $variant->id,
            'product_id' => $variant->product_id,
            'type' => $variant->type->value,
            'name' => $variant->name,
            'price_delta' => $variant->price_delta,
            'is_default' => $variant->is_default,
            'sort_order' => $variant->sort_order,
        ];
    }
}
