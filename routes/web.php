<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\StaffAuthController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\Public\CheckoutPageController;
use App\Http\Controllers\Public\MenuPageController;
use App\Http\Controllers\Public\OrderPageController;
use App\Http\Controllers\Public\PaymentPageController;
use App\Http\Controllers\Public\TableModeController;
use Illuminate\Support\Facades\Route;

Route::middleware('resolve.cart')->group(function (): void {
    Route::get('/', [MenuPageController::class, 'index'])->name('menu');
    Route::get('/produk/{product}', [MenuPageController::class, 'product'])
        ->whereNumber('product')
        ->name('product');
    Route::get('/keranjang', [MenuPageController::class, 'cart'])->name('cart');
    Route::get('/checkout', CheckoutPageController::class)->name('checkout');
});

Route::get('/pembayaran/{token}', PaymentPageController::class)->name('payment');
Route::get('/pesanan/{token}', OrderPageController::class)->name('order');

Route::get('/health', HealthController::class)->name('health');

Route::get('/api-docs', function () {
    if (app()->environment('production')) {
        abort(404);
    }

    return view('api-docs');
});

// Resolusi QR meja: simpan table_id + mode dine-in pada keranjang, lalu redirect ke menu.
Route::get('/meja/{qrToken}', [TableModeController::class, 'showTable'])
    ->middleware('resolve.cart')
    ->name('table.resolve');

// Login staf (admin dan barista) dengan session, tanpa halaman Inertia.
Route::post('/login', [StaffAuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('login');

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [StaffAuthController::class, 'logout'])->name('logout');
    Route::get('/me', [StaffAuthController::class, 'me'])->name('me');
});
