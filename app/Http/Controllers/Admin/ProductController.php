<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ProductBadge;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->with(['category', 'variants', 'addonGroups']);

        if ($request->has('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        return ProductResource::collection($query->orderBy('sort_order')->get());
    }

    public function store(ProductRequest $request): ProductResource
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['is_sold_out'] = $data['is_sold_out'] ?? false;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $product = new Product;
        $product->category_id = (int) $data['category_id'];
        $product->name = (string) $data['name'];
        $product->slug = (string) ($data['slug'] ?? Str::slug((string) $data['name']));
        $product->description = isset($data['description']) ? (string) $data['description'] : null;
        $product->base_price = (int) $data['base_price'];
        $product->is_sold_out = (bool) ($data['is_sold_out'] ?? false);
        $product->is_active = (bool) ($data['is_active'] ?? true);
        $product->badge = isset($data['badge']) ? ProductBadge::from((string) $data['badge']) : null;
        $product->sort_order = (int) ($data['sort_order'] ?? 0);
        $product->save();

        return new ProductResource($product->load(['category', 'variants', 'addonGroups']));
    }

    public function update(ProductRequest $request, Product $product): ProductResource
    {
        $data = $request->validated();

        if (isset($data['name']) && ! isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $product->update($data);

        return new ProductResource($product->fresh(['category', 'variants', 'addonGroups']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(null, 204);
    }

    public function toggleSoldOut(Product $product): ProductResource
    {
        $product->update(['is_sold_out' => ! $product->is_sold_out]);

        return new ProductResource($product->fresh(['category', 'variants', 'addonGroups']));
    }
}
