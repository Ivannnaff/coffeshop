<?php

declare(strict_types=1);

use App\Http\Controllers\Public\CartController;
use App\Http\Controllers\Public\CheckoutController;
use App\Http\Controllers\Public\OrderController;
use Illuminate\Support\Facades\Route;

/*
| Route pelanggan (tanpa login) sesuai 05-API.md bagian 1.
| Prefix /api otomatis dari konfigurasi routing, sehingga cukup /public/...
*/
Route::prefix('public')->group(function (): void {
    Route::middleware('resolve.cart')->group(function (): void {
        Route::get('/cart', [CartController::class, 'show'])
            ->middleware('throttle:cart-items');

        Route::post('/cart/items', [CartController::class, 'store'])
            ->middleware('throttle:cart-items');

        Route::patch('/cart/items/{cartItem}', [CartController::class, 'update'])
            ->whereNumber('cartItem')
            ->middleware('throttle:cart-items');

        Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy'])
            ->whereNumber('cartItem')
            ->middleware('throttle:cart-items');

        Route::post('/checkout/preview', [CheckoutController::class, 'preview'])
            ->middleware('throttle:checkout-preview');

        Route::post('/checkout', [CheckoutController::class, 'store'])
            ->middleware('throttle:checkout');
    });

    Route::get('/orders/{publicToken}', [OrderController::class, 'show'])
        ->middleware('throttle:60,1');
});
