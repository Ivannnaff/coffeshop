<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Http\Resources\CartResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuPageController extends Controller
{
    public function __construct(
        protected CartService $cartService,
    ) {}

    public function index(Request $request): Response
    {
        return $this->menu($request);
    }

    public function product(Request $request, int $product): Response
    {
        /** @var Product $model */
        $model = Product::query()
            ->where('is_active', true)
            ->with([
                'variants' => fn ($query) => $query->orderBy('sort_order'),
                'addonGroups' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['addons' => fn ($addonQuery) => $addonQuery
                        ->where('is_active', true)
                        ->orderBy('sort_order')]),
            ])
            ->findOrFail($product);

        return $this->menu($request, product: $model);
    }

    public function cart(Request $request): Response
    {
        return $this->menu($request, cartOpen: true);
    }

    private function menu(Request $request, ?Product $product = null, bool $cartOpen = false): Response
    {
        $cart = ResolveCart::cart($request);
        $cart->load('table');

        $categories = Category::query()
            ->where('is_active', true)
            ->with(['products' => function ($query): void {
                $query->where('is_active', true)->orderBy('sort_order')->with([
                    'variants' => fn ($relation) => $relation->orderBy('sort_order'),
                    'addonGroups' => fn ($relation) => $relation
                        ->where('is_active', true)
                        ->with(['addons' => fn ($addonQuery) => $addonQuery
                            ->where('is_active', true)
                            ->orderBy('sort_order')]),
                ]);
            }])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Menu/Index', [
            'categories' => CategoryResource::collection($categories)->resolve($request),
            'cart' => (new CartResource($cart, $this->cartService->calculate($cart)))->resolve($request),
            'table' => $cart->table ? [
                'id' => $cart->table->id,
                'number' => $cart->table->number,
            ] : null,
            'product' => $product !== null ? (new ProductResource($product))->resolve($request) : null,
            'cartOpen' => $cartOpen,
        ]);
    }
}
