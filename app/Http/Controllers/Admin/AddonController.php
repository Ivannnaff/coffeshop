<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddonRequest;
use App\Http\Resources\AddonResource;
use App\Models\Addon;
use App\Models\AddonGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AddonController extends Controller
{
    public function index(AddonGroup $addonGroup): AnonymousResourceCollection
    {
        return AddonResource::collection(
            $addonGroup->addons()->orderBy('sort_order')->get()
        );
    }

    public function store(AddonRequest $request, AddonGroup $addonGroup): AddonResource
    {
        $data = $request->validated();
        $data['is_sold_out'] = $data['is_sold_out'] ?? false;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $addon = new Addon;
        $addon->addon_group_id = $addonGroup->id;
        $addon->name = (string) $data['name'];
        $addon->price_delta = (int) $data['price_delta'];
        $addon->is_sold_out = (bool) ($data['is_sold_out'] ?? false);
        $addon->is_active = (bool) ($data['is_active'] ?? true);
        $addon->sort_order = (int) ($data['sort_order'] ?? 0);
        $addon->save();

        return new AddonResource($addon);
    }

    public function update(AddonRequest $request, Addon $addon): AddonResource
    {
        $addon->update($request->validated());

        return new AddonResource($addon->fresh());
    }

    public function destroy(Addon $addon): JsonResponse
    {
        $addon->delete();

        return response()->json(null, 204);
    }
}
