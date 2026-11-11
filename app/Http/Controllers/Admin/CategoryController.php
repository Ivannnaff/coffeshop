<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()->withCount('products')->orderBy('sort_order')->get()
        );
    }

    public function store(CategoryRequest $request): CategoryResource
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;

        $category = new Category;
        $category->name = (string) $data['name'];
        $category->slug = (string) ($data['slug'] ?? Str::slug((string) $data['name']));
        $category->sort_order = (int) ($data['sort_order'] ?? 0);
        $category->is_active = (bool) ($data['is_active'] ?? true);
        $category->save();

        return new CategoryResource($category);
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->validated();

        if (isset($data['name']) && ! isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return new CategoryResource($category->fresh());
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Kategori masih memiliki produk. Pindahkan atau hapus produk terlebih dahulu.',
                'code' => 'CATEGORY_HAS_PRODUCTS',
            ], 422);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}
