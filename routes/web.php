<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\StaffAuthController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', HealthController::class)->name('health');

Route::get('/api-docs', function () {
    if (app()->environment('production')) {
        abort(404);
    }

    return view('api-docs');
});

// Login staf (admin dan barista) dengan session, tanpa halaman Inertia.
Route::post('/login', [StaffAuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('login');

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [StaffAuthController::class, 'logout'])->name('logout');
    Route::get('/me', [StaffAuthController::class, 'me'])->name('me');
});
