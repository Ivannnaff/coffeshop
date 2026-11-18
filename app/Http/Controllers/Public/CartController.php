<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Http\Requests\AddCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function show(Request $request): JsonResponse
    {
        return $this->cartResponse(ResolveCart::cart($request));
    }

    public function store(AddCartItemRequest $request): JsonResponse
    {
        $cart = ResolveCart::cart($request);
        $data = $request->validated();

        /** @var array<int, int> $variantIds */
        $variantIds = array_map('intval', $data['variant_ids'] ?? []);

        $this->cartService->addItem(
            $cart,
            (int) $data['product_id'],
            $variantIds,
            $this->addonQuantities($data, (int) $data['qty']),
            (int) $data['qty'],
            isset($data['note']) ? (string) $data['note'] : null,
        );

        return $this->cartResponse($cart);
    }

    public function update(UpdateCartItemRequest $request, int $cartItem): JsonResponse
    {
        $cart = ResolveCart::cart($request);
        $data = $request->validated();

        /** @var CartItem $item */
        $item = CartItem::query()
            ->whereKey($cartItem)
            ->where('cart_id', $cart->id)
            ->firstOrFail();

        if (
            array_key_exists('variant_ids', $data)
            || array_key_exists('addon_ids', $data)
            || array_key_exists('addons', $data)
        ) {
            $item->load('addons');

            $variantIds = array_key_exists('variant_ids', $data)
                ? array_map('intval', $data['variant_ids'])
                : array_map('intval', $item->product_variant_ids ?? []);

            $qty = array_key_exists('qty', $data) ? (int) $data['qty'] : $item->qty;

            if (array_key_exists('addons', $data)) {
                $addonQtys = $this->addonQuantities($data, $qty);
            } elseif (array_key_exists('addon_ids', $data)) {
                $addonQtys = array_fill_keys(array_map('intval', $data['addon_ids']), $qty);
            } else {
                $addonQtys = $item->addons
                    ->mapWithKeys(fn ($addon): array => [
                        (int) $addon->id => (int) ($addon->pivot->qty ?? $qty),
                    ])
                    ->all();
            }

            $this->cartService->updateItemConfiguration(
                $item,
                $variantIds,
                $addonQtys,
                $qty,
                array_key_exists('note', $data) ? ($data['note'] !== null ? (string) $data['note'] : null) : $item->note,
            );
        } else {
            $qty = array_key_exists('qty', $data) ? (int) $data['qty'] : $item->qty;
            $note = array_key_exists('note', $data) ? $data['note'] : $item->note;

            $this->cartService->updateItem($item, $qty, $note !== null ? (string) $note : null);
        }

        return $this->cartResponse($cart);
    }

    public function destroy(Request $request, int $cartItem): JsonResponse
    {
        $cart = ResolveCart::cart($request);

        /** @var CartItem $item */
        $item = CartItem::query()
            ->whereKey($cartItem)
            ->where('cart_id', $cart->id)
            ->firstOrFail();

        $this->cartService->removeItem($item);

        return $this->cartResponse($cart);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, int> addon id => jumlah cup yang memakai add-on
     */
    private function addonQuantities(array $data, int $defaultQty): array
    {
        if (array_key_exists('addons', $data) && is_array($data['addons']) && $data['addons'] !== []) {
            $quantities = [];

            foreach ($data['addons'] as $addon) {
                $quantities[(int) $addon['addon_id']] = max(1, (int) ($addon['qty'] ?? $defaultQty));
            }

            return $quantities;
        }

        return array_fill_keys(
            array_map('intval', $data['addon_ids'] ?? []),
            max(1, $defaultQty),
        );
    }

    /**
     * Keranjang selalu dihitung ulang dan dikembalikan dengan status 200,
     * termasuk saat baris baru dibuat (201 hanya untuk pesanan pada checkout).
     */
    private function cartResponse(Cart $cart): JsonResponse
    {
        return (new CartResource($cart, $this->cartService->calculate($cart)))
            ->response()
            ->setStatusCode(200);
    }
}
