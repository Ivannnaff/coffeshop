<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MenuController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with(['products' => function ($query): void {
                $query->where('is_active', true)->orderBy('sort_order');
                self::applyMenuRelations($query);
            }])
            ->orderBy('sort_order')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function search(Request $request): AnonymousResourceCollection
    {
        $term = trim($request->string('q')->toString());

        $query = Product::query()
            ->where('is_active', true)
            ->orderBy('sort_order');

        if ($term !== '') {
            $query->where('name', 'like', '%'.$term.'%');
        }

        self::applyMenuRelations($query);

        return ProductResource::collection($query->get());
    }

    /**
     * @param  Builder<Product>|\Illuminate\Database\Eloquent\Relations\HasMany<Product, Category>  $query
     */
    private static function applyMenuRelations(mixed $query): void
    {
        $query->with([
            'variants' => fn ($relation) => $relation->orderBy('sort_order'),
            'addonGroups' => fn ($relation) => $relation
                ->where('is_active', true)
                ->with(['addons' => fn ($addonQuery) => $addonQuery
                    ->where('is_active', true)
                    ->orderBy('sort_order')]),
        ]);
    }
}
