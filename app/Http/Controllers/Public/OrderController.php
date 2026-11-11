<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Enums\OrderStatus;
use App\Enums\VariantType;
use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Http\Resources\CartResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\PublicOrderResource;
use App\Models\Addon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\CartService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class OrderController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected PaymentService $paymentService,
    ) {}

    public function show(string $publicToken): PublicOrderResource
    {
        /** @var Order $order */
        $order = Order::query()
            ->where('public_token', $publicToken)
            ->with(['items.addons', 'statusLogs', 'table', 'deliveryZone', 'payments'])
            ->firstOrFail();

        return new PublicOrderResource($order);
    }

    public function reorder(Request $request, string $publicToken): JsonResponse
    {
        /** @var Order $order */
        $order = Order::query()
            ->where('public_token', $publicToken)
            ->with(['items.addons'])
            ->firstOrFail();

        $cart = ResolveCart::cart($request);
        $skipped = [];

        foreach ($order->items as $item) {
            if ($item->product_id === null) {
                $skipped[] = $item->product_name;

                continue;
            }

            /** @var Product|null $product */
            $product = Product::query()
                ->with(['variants', 'addonGroups.addons'])
                ->find($item->product_id);

            if ($product === null || ! $product->is_active || $product->is_sold_out) {
                $skipped[] = $item->product_name;

                continue;
            }

            $variantIds = $this->variantIdsFor($product, $item);
            $addonIds = $this->addonIdsFor($product, $item);

            try {
                $this->cartService->addItem(
                    $cart,
                    $product->id,
                    $variantIds,
                    $addonIds,
                    $item->qty,
                    $item->note,
                );
            } catch (ProductUnavailableException) {
                $skipped[] = $item->product_name;
            }
        }

        $response = (new CartResource($cart, $this->cartService->calculate($cart)))->response();

        return $response->setStatusCode(200)->setData([
            'data' => $response->getData(true)['data'] ?? [],
            'skipped_items' => $skipped,
        ]);
    }

    public function retryPayment(string $publicToken): JsonResponse
    {
        /** @var Order $order */
        $order = Order::query()->where('public_token', $publicToken)->firstOrFail();

        if ($order->status !== OrderStatus::PendingPayment) {
            return response()->json([
                'message' => 'Pesanan ini tidak sedang menunggu pembayaran.',
                'code' => 'INVALID_ORDER_STATE',
            ], 422);
        }

        if ($order->expires_at !== null && $order->expires_at->isPast()) {
            return response()->json([
                'message' => 'Batas waktu pembayaran pesanan ini sudah lewat.',
                'code' => 'ORDER_EXPIRED',
            ], 409);
        }

        $payment = $this->paymentService->initiatePayment($order);

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    /**
     * @return list<int>
     */
    private function variantIdsFor(Product $product, OrderItem $item): array
    {
        $ids = [];

        if ($item->size_name !== null) {
            $variant = $product->variants->first(
                fn ($variant): bool => $variant->type === VariantType::Size && $variant->name === $item->size_name
            );

            if ($variant !== null) {
                $ids[] = $variant->id;
            }
        }

        if ($item->temperature_name !== null) {
            $variant = $product->variants->first(
                fn ($variant): bool => $variant->type === VariantType::Temperature && $variant->name === $item->temperature_name
            );

            if ($variant !== null) {
                $ids[] = $variant->id;
            }
        }

        return $ids;
    }

    /**
     * @return list<int>
     */
    private function addonIdsFor(Product $product, OrderItem $item): array
    {
        /** @var Collection<int, Addon> $availableAddons */
        $availableAddons = $product->addonGroups->flatMap(
            fn ($group) => $group->addons
        );

        $ids = [];

        foreach ($item->addons as $orderAddon) {
            $addon = $availableAddons->first(
                fn (Addon $candidate): bool => $candidate->id === $orderAddon->addon_id
                    && $candidate->is_active
                    && ! $candidate->is_sold_out
            );

            if ($addon !== null) {
                $ids[] = $addon->id;
            }
        }

        return $ids;
    }
}
