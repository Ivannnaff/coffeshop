<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Resources\StoreSettingResource;
use App\Services\StoreSettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        protected StoreSettingsService $storeSettingsService,
    ) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $store = null;

        try {
            $store = new StoreSettingResource($this->storeSettingsService->get());
        } catch (Throwable) {
            // Toko belum dikonfigurasi; halaman menampilkan status yang jujur.
        }

        return [
            ...parent::share($request),
            'store' => $store,
        ];
    }
}
