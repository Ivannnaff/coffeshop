<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSettingRequest;
use App\Http\Resources\StoreSettingResource;
use App\Services\StoreSettingsService;

class StoreSettingController extends Controller
{
    public function __construct(
        protected StoreSettingsService $storeSettings
    ) {}

    public function show(): StoreSettingResource
    {
        return new StoreSettingResource($this->storeSettings->get());
    }

    public function update(StoreSettingRequest $request): StoreSettingResource
    {
        $settings = $this->storeSettings->get();
        $settings->update($request->validated());

        return new StoreSettingResource($settings->fresh());
    }
}
