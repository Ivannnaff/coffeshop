<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\AddonSelectionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddonGroupRequest;
use App\Http\Resources\AddonGroupResource;
use App\Models\AddonGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AddonGroupController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AddonGroupResource::collection(
            AddonGroup::query()->with('addons')->orderBy('name')->get()
        );
    }

    public function store(AddonGroupRequest $request): AddonGroupResource
    {
        $data = $request->validated();
        $data['min_select'] = $data['min_select'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;

        $group = new AddonGroup;
        $group->name = (string) $data['name'];
        $group->selection_type = AddonSelectionType::from((string) $data['selection_type']);
        $group->min_select = (int) ($data['min_select'] ?? 0);
        $group->max_select = isset($data['max_select']) ? (int) $data['max_select'] : null;
        $group->is_active = (bool) ($data['is_active'] ?? true);
        $group->save();

        return new AddonGroupResource($group->load('addons'));
    }

    public function update(AddonGroupRequest $request, AddonGroup $addonGroup): AddonGroupResource
    {
        $addonGroup->update($request->validated());

        return new AddonGroupResource($addonGroup->fresh('addons'));
    }

    public function destroy(AddonGroup $addonGroup): JsonResponse
    {
        $addonGroup->delete();

        return response()->json(null, 204);
    }
}
