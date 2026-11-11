<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Pricing\DTO\PricedItem;
use App\Domain\Pricing\DTO\PricingResult;
use App\Models\Cart;
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
                ], $item->addons),
                'unit_price' => $item->unitPrice,
                'qty' => $item->qty,
                'line_total' => $item->lineTotal,
                'is_delivery_eligible' => $item->isDeliveryEligible,
                'note' => $item->note,
            ], $this->pricing->items),
            'subtotal' => $this->pricing->subtotal,
            'eligible_subtotal' => $this->pricing->eligibleSubtotal,
            'min_item_price' => $this->pricing->minItemPrice,
        ];
    }
}
