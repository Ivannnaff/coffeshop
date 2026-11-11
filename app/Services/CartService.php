<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Cart\Exceptions\CartExpiredException;
use App\Domain\Pricing\DTO\PricingResult;
use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Domain\Pricing\PriceCalculator;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Pricing\CartItemMapper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartService
{
    public function __construct(
        protected PriceCalculator $priceCalculator,
        protected CartItemMapper $mapper,
        protected StoreSettingsService $storeSettings,
    ) {}

    public function create(): Cart
    {
        return Cart::create([
            'token' => Str::random(48),
            'mode' => 'takeaway',
            'last_activity_at' => now(),
            'expires_at' => now()->addHours((int) config('menanti.cart_ttl_hours', 24)),
        ]);
    }

    public function findActiveByToken(string $token): ?Cart
    {
        /** @var Cart|null $cart */
        $cart = Cart::where('token', $token)->first();

        if ($cart === null) {
            return null;
        }

        if ($cart->expires_at !== null && $cart->expires_at->isPast()) {
            return null;
        }

        return $cart;
    }

    public function assertActive(Cart $cart): void
    {
        if ($cart->expires_at !== null && $cart->expires_at->isPast()) {
            throw CartExpiredException::because();
        }
    }

    /**
     * @param  list<int>  $variantIds
     * @param  list<int>  $addonIds
     */
    public function addItem(
        Cart $cart,
        int $productId,
        array $variantIds,
        array $addonIds,
        int $qty,
        ?string $note = null,
    ): CartItem {
        $this->assertActive($cart);

        /** @var Product $product */
        $product = Product::with(['variants', 'addonGroups'])->findOrFail($productId);

        if (! $product->is_active || $product->is_sold_out) {
            throw ProductUnavailableException::because($product->name);
        }

        $availableVariantIds = $product->variants->pluck('id')->all();

        foreach ($variantIds as $variantId) {
            if (! in_array($variantId, $availableVariantIds, true)) {
                throw ProductUnavailableException::because($product->name);
            }
        }

        return DB::transaction(function () use ($cart, $product, $variantIds, $addonIds, $qty, $note): CartItem {
            /** @var CartItem $item */
            $item = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'product_variant_ids' => array_values($variantIds),
                'qty' => $qty,
                'note' => $note,
            ]);

            $item->addons()->sync($addonIds);
            $item->load('product.variants', 'product.addonGroups', 'addons');

            // Validasi ulang add-on dan ketersediaan produk sebelum commit.
            $this->priceCalculator->calculateItem(
                $this->mapper->toInput($item),
                $this->storeSettings->minItemPrice()
            );

            $this->touch($cart);

            return $item;
        });
    }

    public function updateItem(CartItem $item, int $qty, ?string $note): CartItem
    {
        $this->assertActive($item->cart);

        $item->update([
            'qty' => $qty,
            'note' => $note,
        ]);

        $this->touch($item->cart);

        return $item;
    }

    public function removeItem(CartItem $item): void
    {
        $cart = $item->cart;
        $item->delete();

        if ($cart !== null) {
            $this->touch($cart);
        }
    }

    public function clear(Cart $cart): void
    {
        $cart->items()->delete();
        $this->touch($cart);
    }

    public function calculate(Cart $cart): PricingResult
    {
        $cart->load([
            'items.product.variants',
            'items.product.addonGroups',
            'items.addons',
        ]);

        $inputs = [];

        foreach ($cart->items as $item) {
            $inputs[] = $this->mapper->toInput($item);
        }

        return $this->priceCalculator->calculate($inputs, $this->storeSettings->minItemPrice());
    }

    public function pruneExpired(): int
    {
        return Cart::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->delete();
    }

    private function touch(Cart $cart): void
    {
        $cart->update([
            'last_activity_at' => now(),
            'expires_at' => now()->addHours((int) config('menanti.cart_ttl_hours', 24)),
        ]);
    }
}
