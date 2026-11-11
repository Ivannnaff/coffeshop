<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use App\Services\StoreSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected StoreSettingsService $storeSettingsService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $cart = ResolveCart::cart($request);
        $cart->load('table');
        $store = $this->storeSettingsService->get();

        return Inertia::render('Checkout/Index', [
            'cart' => (new CartResource($cart, $this->cartService->calculate($cart)))->resolve($request),
            'store' => [
                'name' => $store->name,
                'address' => $store->address,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
            ],
            'table' => $cart->table ? [
                'number' => $cart->table->number,
            ] : null,
        ]);
    }
}
