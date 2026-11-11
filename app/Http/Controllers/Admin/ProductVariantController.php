<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\VariantType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductVariantRequest;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductVariantController extends Controller
{
    public function index(Product $product): AnonymousResourceCollection
    {
        return ProductVariantResource::collection(
            $product->variants()->orderBy('type')->orderBy('sort_order')->get()
        );
    }

    public function store(ProductVariantRequest $request, Product $product): ProductVariantResource
    {
        $data = $request->validated();
        $data['is_default'] = $data['is_default'] ?? false;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($data['is_default'] === true) {
            $product->variants()->where('type', $data['type'])->update(['is_default' => false]);
        }

        $variant = new ProductVariant;
        $variant->product_id = $product->id;
        $variant->type = VariantType::from((string) $data['type']);
        $variant->name = (string) $data['name'];
        $variant->price_delta = (int) $data['price_delta'];
        $variant->is_default = (bool) ($data['is_default'] ?? false);
        $variant->sort_order = (int) ($data['sort_order'] ?? 0);
        $variant->save();

        return new ProductVariantResource($variant);
    }

    public function update(ProductVariantRequest $request, ProductVariant $variant): ProductVariantResource
    {
        $data = $request->validated();

        if (($data['is_default'] ?? false) === true) {
            $variant->product?->variants()
                ->where('type', $data['type'] ?? $variant->type->value)
                ->whereKeyNot($variant->id)
                ->update(['is_default' => false]);
        }

        $variant->update($data);

        return new ProductVariantResource($variant->fresh());
    }

    public function destroy(ProductVariant $variant): JsonResponse
    {
        $variant->delete();

        return response()->json(null, 204);
    }
}
