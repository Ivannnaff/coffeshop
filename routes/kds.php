<?php

declare(strict_types=1);

use App\Http\Controllers\Kds\KdsOrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('kds')
    ->middleware(['auth', 'role:barista,admin'])
    ->group(function (): void {
        Route::get('/orders', [KdsOrderController::class, 'index']);
        Route::post('/orders/{order}/start', [KdsOrderController::class, 'start']);
        Route::post('/orders/{order}/ready', [KdsOrderController::class, 'ready']);
        Route::post('/orders/{order}/complete', [KdsOrderController::class, 'complete']);
        Route::post('/orders/{order}/dispatch', [KdsOrderController::class, 'dispatch']);
        Route::post('/orders/{order}/deliver', [KdsOrderController::class, 'deliver']);
    });
