<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeliveryZoneRequest;
use App\Http\Resources\DeliveryZoneResource;
use App\Models\DeliveryZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeliveryZoneController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DeliveryZoneResource::collection(
            DeliveryZone::query()
                ->with('feeRules')
                ->orderBy('sort_order')
                ->orderBy('max_distance_km')
                ->get()
        );
    }

    public function store(DeliveryZoneRequest $request): DeliveryZoneResource
    {
        $data = $request->validated();

        $zone = DeliveryZone::create([
            'store_id' => (int) ($data['store_id'] ?? 1),
            'name' => (string) $data['name'],
            'max_distance_km' => (float) $data['max_distance_km'],
            'base_fee' => (int) $data['base_fee'],
            'free_fee_min_subtotal' => isset($data['free_fee_min_subtotal'])
                ? (int) $data['free_fee_min_subtotal']
                : null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return new DeliveryZoneResource($zone->load('feeRules'));
    }

    public function update(DeliveryZoneRequest $request, DeliveryZone $deliveryZone): DeliveryZoneResource
    {
        $deliveryZone->update($request->validated());

        return new DeliveryZoneResource($deliveryZone->fresh('feeRules'));
    }

    public function destroy(DeliveryZone $deliveryZone): JsonResponse
    {
        $deliveryZone->delete();

        return response()->json(null, 204);
    }
}
