<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Pricing\DTO\PricedItem;
use App\Domain\Pricing\DTO\PricingResult;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function __construct(
        private readonly Cart $cart,
        private readonly PricingResult $pricing,
    ) {
        parent::__construct($cart);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $productIds = array_values(array_unique(array_map(
            fn (PricedItem $item): int => $item->productId,
            $this->pricing->items,
        )));

        $products = Product::query()
            ->whereIn('id', $productIds)
            ->with(['addonGroups' => fn ($query) => $query
                ->where('is_active', true)
                ->with(['addons' => fn ($addonQuery) => $addonQuery
                    ->where('is_active', true)
                    ->orderBy('sort_order')])])
            ->get()
            ->keyBy('id');

        return [
            'token' => $this->cart->token,
            'mode' => $this->cart->mode->value,
            'items' => array_map(fn (PricedItem $item): array => [
                'id' => $item->cartItemId,
                'product_id' => $item->productId,
                'product_name' => $item->productName,
                'size_name' => $item->sizeName,
                'temperature_name' => $item->temperatureName,
                'addons' => array_map(fn ($addon): array => [
                    'id' => $addon->id,
                    'name' => $addon->name,
                    'price_delta' => $addon->priceDelta,
                    'qty' => $addon->qty,
                ], $item->addons),
                'unit_price' => $item->unitPrice,
                'qty' => $item->qty,
                'line_total' => $item->lineTotal,
                'is_delivery_eligible' => $item->isDeliveryEligible,
                'is_available' => $item->isAvailable,
                'unavailable_reason' => $item->unavailableReason,
                'note' => $item->note,
                'addon_options' => isset($products[$item->productId])
                    ? AddonGroupResource::collection($products[$item->productId]->addonGroups)->resolve($request)
                    : [],
            ], $this->pricing->items),
            'has_unavailable_items' => in_array(false, array_map(
                fn (PricedItem $item): bool => $item->isAvailable,
                $this->pricing->items
            ), true),
            'subtotal' => $this->pricing->subtotal,
            'eligible_subtotal' => $this->pricing->eligibleSubtotal,
            'min_item_price' => $this->pricing->minItemPrice,
        ];
    }
}
