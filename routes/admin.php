<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AddonController;
use App\Http\Controllers\Admin\AddonGroupController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DeliveryFeeRuleController;
use App\Http\Controllers\Admin\DeliveryZoneController;
use App\Http\Controllers\Admin\ProductAddonGroupController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductImageController;
use App\Http\Controllers\Admin\ProductVariantController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\StoreSettingController;
use App\Http\Controllers\Admin\TableController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->middleware(['auth', 'role:admin', 'audit.admin'])
    ->group(function (): void {
        Route::apiResource('categories', CategoryController::class)->except(['show']);
        Route::apiResource('products', ProductController::class)->except(['show']);
        Route::patch('products/{product}/sold-out', [ProductController::class, 'toggleSoldOut']);
        Route::post('products/{product}/image', [ProductImageController::class, 'store']);

        Route::get('products/{product}/variants', [ProductVariantController::class, 'index']);
        Route::post('products/{product}/variants', [ProductVariantController::class, 'store']);
        Route::put('variants/{variant}', [ProductVariantController::class, 'update']);
        Route::delete('variants/{variant}', [ProductVariantController::class, 'destroy']);

        Route::apiResource('addon-groups', AddonGroupController::class)->except(['show']);
        Route::get('addon-groups/{addonGroup}/addons', [AddonController::class, 'index']);
        Route::post('addon-groups/{addonGroup}/addons', [AddonController::class, 'store']);
        Route::put('addons/{addon}', [AddonController::class, 'update']);
        Route::delete('addons/{addon}', [AddonController::class, 'destroy']);

        Route::put('products/{product}/addon-groups', [ProductAddonGroupController::class, 'sync']);

        Route::apiResource('tables', TableController::class)->except(['show']);
        Route::post('tables/{table}/regenerate-token', [TableController::class, 'regenerateToken']);

        Route::get('store-settings', [StoreSettingController::class, 'show']);
        Route::put('store-settings', [StoreSettingController::class, 'update']);

        Route::apiResource('delivery-zones', DeliveryZoneController::class)->except(['show']);
        Route::get('delivery-zones/{deliveryZone}/fee-rules', [DeliveryFeeRuleController::class, 'index']);
        Route::post('delivery-zones/{deliveryZone}/fee-rules', [DeliveryFeeRuleController::class, 'store']);
        Route::put('delivery-fee-rules/{deliveryFeeRule}', [DeliveryFeeRuleController::class, 'update']);
        Route::delete('delivery-fee-rules/{deliveryFeeRule}', [DeliveryFeeRuleController::class, 'destroy']);

        Route::get('reports/summary', [ReportController::class, 'summary']);
    });
