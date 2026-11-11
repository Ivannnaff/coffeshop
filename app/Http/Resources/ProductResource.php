<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Product $product */
        $product = $this->resource;

        return [
            'id' => $product->id,
            'category_id' => $product->category_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'base_price' => $product->base_price,
            'image_path' => $product->image_path,
            'is_sold_out' => $product->is_sold_out,
            'is_active' => $product->is_active,
            'badge' => $product->badge?->value,
            'sort_order' => $product->sort_order,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'addon_groups' => AddonGroupResource::collection($this->whenLoaded('addonGroups')),
        ];
    }
}
