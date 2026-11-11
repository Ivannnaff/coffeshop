<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeliveryFeeRuleRequest;
use App\Http\Resources\DeliveryFeeRuleResource;
use App\Models\DeliveryFeeRule;
use App\Models\DeliveryZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeliveryFeeRuleController extends Controller
{
    public function index(DeliveryZone $deliveryZone): AnonymousResourceCollection
    {
        return DeliveryFeeRuleResource::collection(
            $deliveryZone->feeRules()->orderBy('min_eligible_subtotal')->get()
        );
    }

    public function store(DeliveryFeeRuleRequest $request, DeliveryZone $deliveryZone): DeliveryFeeRuleResource
    {
        $data = $request->validated();

        $rule = $deliveryZone->feeRules()->create([
            'min_eligible_subtotal' => (int) $data['min_eligible_subtotal'],
            'discount_type' => (string) $data['discount_type'],
            'discount_value' => $data['discount_type'] === 'free'
                ? null
                : (int) $data['discount_value'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return new DeliveryFeeRuleResource($rule);
    }

    public function update(DeliveryFeeRuleRequest $request, DeliveryFeeRule $deliveryFeeRule): DeliveryFeeRuleResource
    {
        $data = $request->validated();

        if (($data['discount_type'] ?? null) === 'free') {
            $data['discount_value'] = null;
        }

        $deliveryFeeRule->update($data);

        return new DeliveryFeeRuleResource($deliveryFeeRule->fresh());
    }

    public function destroy(DeliveryFeeRule $deliveryFeeRule): JsonResponse
    {
        $deliveryFeeRule->delete();

        return response()->json(null, 204);
    }
}
