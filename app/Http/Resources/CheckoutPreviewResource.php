<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\Checkout\DTO\CheckoutPreview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckoutPreviewResource extends JsonResource
{
    public function __construct(private readonly CheckoutPreview $preview)
    {
        parent::__construct($preview);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'subtotal' => $this->preview->pricing->subtotal,
            'eligible_subtotal' => $this->preview->pricing->eligibleSubtotal,
            'delivery_fee' => $this->preview->deliveryFee,
            'delivery_discount' => $this->preview->deliveryDiscount,
            'total' => $this->preview->total,
            'zone_id' => $this->preview->zoneId,
            'zone_name' => $this->preview->zoneName,
            'distance_km' => $this->preview->distanceKm,
            'min_item_price' => $this->preview->minItemPrice,
        ];
    }
}
