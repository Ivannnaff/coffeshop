<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Delivery\DeliveryFeeCalculator;
use App\Domain\Delivery\DeliveryZoneResolver;
use App\Domain\Delivery\DTO\DeliveryFeeRuleDefinition;
use App\Domain\Delivery\DTO\DeliveryQuote;
use App\Domain\Delivery\DTO\DeliveryZoneItem;
use App\Domain\Delivery\GeoDistanceCalculator;
use App\Domain\Order\Exceptions\StoreClosedException;
use App\Domain\Order\Exceptions\TooManyActiveOrdersException;
use App\Domain\Pricing\DTO\PricingResult;
use App\Domain\Store\Exceptions\StoreConfigurationException;
use App\Domain\Store\StoreOpeningHours;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Models\Cart;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\OrderStatusLog;
use App\Models\StoreSetting;
use App\Services\Checkout\DTO\CheckoutInput;
use App\Services\Checkout\DTO\CheckoutPreview;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected StoreSettingsService $storeSettings,
        protected DeliveryZoneResolver $zoneResolver,
        protected DeliveryFeeCalculator $feeCalculator,
        protected GeoDistanceCalculator $geoCalculator,
        protected StoreOpeningHours $openingHours,
    ) {}

    public function preview(Cart $cart, OrderMode $mode, ?float $latitude = null, ?float $longitude = null): CheckoutPreview
    {
        $this->cartService->assertActive($cart);
        $this->assertStoreCanAcceptOrders();

        $pricing = $this->pricedCart($cart);
        $quote = $this->deliveryQuote($mode, $pricing->eligibleSubtotal, $latitude, $longitude);

        return $this->buildPreview($pricing, $quote);
    }

    public function checkout(Cart $cart, CheckoutInput $input): Order
    {
        $this->cartService->assertActive($cart);
        $this->assertStoreCanAcceptOrders();
        $this->assertModeAllowed($cart, $input->mode);

        $pricing = $this->pricedCart($cart);
        $quote = $this->deliveryQuote(
            $input->mode,
            $pricing->eligibleSubtotal,
            $input->deliveryLatitude,
            $input->deliveryLongitude,
        );
        $preview = $this->buildPreview($pricing, $quote);

        return DB::transaction(function () use ($cart, $input, $pricing, $preview): Order {
            // Lock keranjang agar dua checkout bersamaan tidak membuat order ganda.
            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->first();

            if ($lockedCart === null || ! $lockedCart->items()->exists()) {
                throw ValidationException::withMessages([
                    'cart' => 'Keranjang sudah kosong atau sudah diproses.',
                ]);
            }

            // Batas pesanan aktif dicek di dalam transaksi dengan lock (B-11).
            $this->assertActiveOrderLimit($input->customerPhone);

            /** @var StoreSetting $store */
            $store = $this->storeSettings->get();
            $now = Carbon::now($store->timezone ?? 'Asia/Jakarta');
            $table = $input->mode === OrderMode::DineIn ? $cart->table : null;

            /** @var Order $order */
            $order = Order::create([
                'store_id' => $store->store_id,
                'order_number' => $this->generateOrderNumber($now),
                'public_token' => Str::random(48),
                'mode' => $input->mode,
                'status' => OrderStatus::PendingPayment,
                'table_id' => $table?->id,
                'table_number' => $table?->number,
                'customer_name' => $input->customerName,
                'customer_phone' => $input->customerPhone,
                'delivery_address' => $input->mode === OrderMode::Delivery ? $input->deliveryAddress : null,
                'delivery_latitude' => $input->mode === OrderMode::Delivery ? $input->deliveryLatitude : null,
                'delivery_longitude' => $input->mode === OrderMode::Delivery ? $input->deliveryLongitude : null,
                'delivery_distance_km' => $preview->distanceKm,
                'delivery_zone_id' => $preview->zoneId,
                'delivery_zone_name' => $preview->zoneName,
                'subtotal' => $pricing->subtotal,
                'eligible_subtotal' => $pricing->eligibleSubtotal,
                'delivery_fee' => $preview->deliveryFee,
                'delivery_discount' => $preview->deliveryDiscount,
                'total' => $preview->total,
                'min_item_price_snapshot' => $preview->minItemPrice,
                'pickup_note' => $input->pickupNote,
                'expires_at' => $now->copy()->addMinutes($this->storeSettings->paymentExpiryMinutes()),
            ]);

            foreach ($pricing->items as $pricedItem) {
                /** @var OrderItem $orderItem */
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $pricedItem->productId,
                    'product_name' => $pricedItem->productName,
                    'size_name' => $pricedItem->sizeName,
                    'temperature_name' => $pricedItem->temperatureName,
                    'base_price' => $pricedItem->basePrice,
                    'variant_delta' => $pricedItem->variantDelta,
                    'addons_total' => $pricedItem->addonsTotal,
                    'discount_amount' => $pricedItem->discountAmount,
                    'unit_price' => $pricedItem->unitPrice,
                    'qty' => $pricedItem->qty,
                    'line_total' => $pricedItem->lineTotal,
                    'is_delivery_eligible' => $pricedItem->isDeliveryEligible,
                    'note' => $pricedItem->note,
                ]);

                foreach ($pricedItem->addons as $addon) {
                    OrderItemAddon::create([
                        'order_item_id' => $orderItem->id,
                        'addon_id' => $addon->id,
                        'addon_name' => $addon->name,
                        'price_delta' => $addon->priceDelta,
                    ]);
                }
            }

            OrderStatusLog::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => OrderStatus::PendingPayment->value,
                'actor_type' => StatusActorType::System->value,
                'note' => 'Pesanan dibuat.',
                'created_at' => $now,
            ]);

            $this->cartService->clear($cart);
            $cart->delete();

            return $order->load('items.addons', 'statusLogs');
        });
    }

    private function pricedCart(Cart $cart): PricingResult
    {
        // Checkout dan preview wajib memakai perhitungan ketat: item yang sold out,
        // nonaktif, atau variannya hilang harus menolak pesanan, bukan dihitung 0.
        $pricing = $this->cartService->calculateStrict($cart);

        if ($pricing->items === []) {
            throw ValidationException::withMessages([
                'cart' => 'Keranjang masih kosong.',
            ]);
        }

        return $pricing;
    }

    private function deliveryQuote(
        OrderMode $mode,
        int $eligibleSubtotal,
        ?float $latitude,
        ?float $longitude,
    ): ?DeliveryQuote {
        if ($mode !== OrderMode::Delivery) {
            return null;
        }

        if ($latitude === null || $longitude === null) {
            throw ValidationException::withMessages([
                'delivery' => 'Koordinat pengiriman wajib diisi untuk mode delivery.',
            ]);
        }

        $store = $this->storeSettings->get();

        if ($store->latitude === null || $store->longitude === null) {
            throw StoreConfigurationException::missingDeliveryCoordinates();
        }

        $distanceKm = $this->geoCalculator->distanceKm(
            (float) $store->latitude,
            (float) $store->longitude,
            $latitude,
            $longitude,
        );

        $zone = $this->zoneResolver->resolve($distanceKm, $this->deliveryZones());

        return $this->feeCalculator->quote($zone, $distanceKm, $eligibleSubtotal);
    }

    /**
     * @return list<DeliveryZoneItem>
     */
    private function deliveryZones(): array
    {
        return DeliveryZone::query()
            ->where('is_active', true)
            ->with('feeRules')
            ->get()
            ->map(fn (DeliveryZone $zone): DeliveryZoneItem => new DeliveryZoneItem(
                id: $zone->id,
                name: $zone->name,
                maxDistanceKm: (float) $zone->max_distance_km,
                baseFee: (int) $zone->base_fee,
                freeFeeMinSubtotal: $zone->free_fee_min_subtotal !== null ? (int) $zone->free_fee_min_subtotal : null,
                rules: $zone->feeRules->map(fn ($rule): DeliveryFeeRuleDefinition => new DeliveryFeeRuleDefinition(
                    minEligibleSubtotal: (int) $rule->min_eligible_subtotal,
                    discountType: $rule->discount_type,
                    discountValue: $rule->discount_value !== null ? (int) $rule->discount_value : null,
                    isActive: (bool) $rule->is_active,
                ))->all(),
                isActive: (bool) $zone->is_active,
            ))
            ->all();
    }

    private function buildPreview(PricingResult $pricing, ?DeliveryQuote $quote): CheckoutPreview
    {
        $deliveryFee = $quote->baseFee ?? 0;
        $deliveryDiscount = $quote->deliveryDiscount ?? 0;

        return new CheckoutPreview(
            pricing: $pricing,
            deliveryFee: $deliveryFee,
            deliveryDiscount: $deliveryDiscount,
            total: $pricing->subtotal + $deliveryFee - $deliveryDiscount,
            zoneId: $quote?->zoneId,
            zoneName: $quote?->zoneName,
            distanceKm: $quote !== null ? round($quote->distanceKm, 2) : null,
            minItemPrice: $pricing->minItemPrice,
        );
    }

    private function assertStoreCanAcceptOrders(): void
    {
        $store = $this->storeSettings->get();
        $now = Carbon::now($store->timezone ?? 'Asia/Jakarta');

        if (! $store->is_accepting_orders || ! $this->openingHours->isOpen(
            $now,
            $store->opening_time,
            $store->closing_time,
        )) {
            throw StoreClosedException::because();
        }
    }

    private function assertModeAllowed(Cart $cart, OrderMode $mode): void
    {
        if ($cart->mode === OrderMode::DineIn && $mode !== OrderMode::DineIn) {
            throw ValidationException::withMessages([
                'mode' => 'Pesanan dari meja tidak bisa diubah ke mode lain.',
            ]);
        }

        if ($mode === OrderMode::DineIn) {
            $table = $cart->table;

            if ($table === null || ! $table->is_active || $table->trashed()) {
                throw ValidationException::withMessages([
                    'mode' => 'Meja tidak valid atau sudah tidak aktif.',
                ]);
            }
        }
    }

    private function assertActiveOrderLimit(string $customerPhone): void
    {
        $limit = (int) config('menanti.active_order_limit_per_phone', 3);

        $activeCount = Order::query()
            ->where('customer_phone', $customerPhone)
            ->where('status', OrderStatus::PendingPayment->value)
            ->where('expires_at', '>', now())
            ->lockForUpdate()
            ->count();

        if ($activeCount >= $limit) {
            throw TooManyActiveOrdersException::because($limit);
        }
    }

    private function generateOrderNumber(Carbon $now): string
    {
        $prefix = (string) config('menanti.order_number_prefix', 'MNT');
        $date = $now->format('ymd');

        $todayPrefix = sprintf('%s-%s-', $prefix, $date);

        $maxOrderNumber = Order::query()
            ->where('order_number', 'like', $todayPrefix.'%')
            ->orderByDesc('id')
            ->value('order_number');

        $sequence = 1;
        if ($maxOrderNumber !== null) {
            $parts = explode('-', $maxOrderNumber);
            $lastSeq = (int) end($parts);
            $sequence = $lastSeq + 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
