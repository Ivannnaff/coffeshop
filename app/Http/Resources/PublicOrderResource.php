<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class PublicOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Order $order */
        $order = $this->resource;

        $maskedName = $order->customer_name !== '' ? mb_substr($order->customer_name, 0, 1).'***' : '***';

        return [
            'order_number' => $order->order_number,
            'public_token' => $order->public_token,
            'status' => $order->status->value,
            'mode' => $order->mode->value,
            'table_number' => $order->table_number,
            'customer_name' => $maskedName,
            'delivery_address' => $order->delivery_address !== null ? 'Alamat pengiriman terdaftar' : null,
            'delivery_distance_km' => $order->delivery_distance_km,
            'delivery_zone_name' => $order->delivery_zone_name,
            'version' => $order->updated_at?->getTimestampMs(),
            'items' => $order->items->map(fn (OrderItem $item): array => [
                'product_name' => $item->product_name,
                'size_name' => $item->size_name,
                'temperature_name' => $item->temperature_name,
                'addons' => $item->addons->map(fn (OrderItemAddon $addon): array => [
                    'name' => $addon->addon_name,
                    'price_delta' => $addon->price_delta,
                ]),
                'unit_price' => $item->unit_price,
                'qty' => $item->qty,
                'line_total' => $item->line_total,
                'is_delivery_eligible' => $item->is_delivery_eligible,
                'note' => $item->note,
            ]),
            'subtotal' => $order->subtotal,
            'eligible_subtotal' => $order->eligible_subtotal,
            'delivery_fee' => $order->delivery_fee,
            'delivery_discount' => $order->delivery_discount,
            'total' => $order->total,
            'min_item_price_snapshot' => $order->min_item_price_snapshot,
            'pickup_note' => $order->pickup_note,
            'expires_at' => $order->expires_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'completed_at' => $order->completed_at?->toIso8601String(),
            'created_at' => $order->created_at?->toIso8601String(),
            'payment' => $order->relationLoaded('payments') && $order->payments->isNotEmpty()
                ? new PaymentResource($order->payments->sortByDesc('id')->first())
                : null,
        ];
    }
}
