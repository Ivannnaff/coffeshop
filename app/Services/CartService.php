<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Cart\Exceptions\CartExpiredException;
use App\Domain\Pricing\DTO\PricingResult;
use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Domain\Pricing\PriceCalculator;
use App\Models\Addon;
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
     * @param  array<int, int>  $addonQtys  addon id => jumlah cup yang memakai add-on.
     */
    public function addItem(
        Cart $cart,
        int $productId,
        array $variantIds,
        array $addonQtys,
        int $qty,
        ?string $note = null,
    ): CartItem {
        $this->assertActive($cart);

        /** @var Product $product */
        $product = Product::with(['variants', 'addonGroups'])->findOrFail($productId);

        if (! $product->is_active || $product->is_sold_out) {
            throw ProductUnavailableException::because($product->name);
        }

        $variantIds = array_values(array_unique(array_map('intval', $variantIds)));
        sort($variantIds);
        $addonQtys = $this->normalizeAddonQuantities($product, $addonQtys, $qty);
        $addonIds = array_keys($addonQtys);
        $note = $note !== null ? trim($note) : null;
        $note = $note === '' ? null : $note;

        $availableVariantIds = array_map('intval', $product->variants->pluck('id')->all());

        foreach ($variantIds as $variantId) {
            if (! in_array($variantId, $availableVariantIds, true)) {
                throw ProductUnavailableException::because($product->name);
            }
        }

        return DB::transaction(function () use ($cart, $product, $variantIds, $addonQtys, $addonIds, $qty, $note): CartItem {
            /** @var Cart $lockedCart */
            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();

            // Baris dengan produk, varian, add-on, dan catatan yang sama digabung
            // dengan menambah qty, bukan membuat baris baru.
            /** @var CartItem|null $existing */
            $existing = $lockedCart->items()
                ->where('product_id', $product->id)
                ->with('addons')
                ->get()
                ->first(fn (CartItem $item): bool => $this->matchesConfiguration($item, $variantIds, $addonIds, $note));

            if ($existing !== null) {
                $existing->update(['qty' => min(99, $existing->qty + $qty)]);
                $this->mergeAddonQuantities($existing, $addonQtys);
                $existing->load('product.variants', 'product.addonGroups', 'addons');

                $this->priceCalculator->calculateItem(
                    $this->mapper->toInput($existing),
                    $this->storeSettings->minItemPrice()
                );

                $this->touch($lockedCart);

                return $existing;
            }

            /** @var CartItem $item */
            $item = CartItem::create([
                'cart_id' => $lockedCart->id,
                'product_id' => $product->id,
                'product_variant_ids' => $variantIds,
                'qty' => $qty,
                'note' => $note,
            ]);

            $this->syncAddonQuantities($item, $addonQtys);
            $item->load('product.variants', 'product.addonGroups', 'addons');

            // Validasi ulang add-on dan ketersediaan produk sebelum commit.
            $this->priceCalculator->calculateItem(
                $this->mapper->toInput($item),
                $this->storeSettings->minItemPrice()
            );

            $this->touch($lockedCart);

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

        $item->load('addons');

        // Qty baris bisa turun di bawah jumlah add-on, jadi jumlahnya disesuaikan
        // agar sisa cup tidak ikut tertagih add-on.
        $current = $item->addons
            ->mapWithKeys(fn ($addon): array => [(int) $addon->id => (int) ($addon->pivot->qty ?? 1)])
            ->all();

        $this->syncAddonQuantities($item, $this->normalizeAddonQuantities($item->product, $current, $qty));

        $this->touch($item->cart);

        return $item;
    }

    /**
     * @param  list<int>  $variantIds
     * @param  array<int, int>  $addonQtys  addon id => jumlah cup yang memakai add-on.
     */
    public function updateItemConfiguration(
        CartItem $item,
        array $variantIds,
        array $addonQtys,
        int $qty,
        ?string $note,
    ): CartItem {
        $cart = Cart::query()->findOrFail($item->cart_id);
        $this->assertActive($cart);

        /** @var Product $product */
        $product = Product::query()
            ->with(['variants', 'addonGroups'])
            ->findOrFail($item->product_id);

        $variantIds = array_values(array_unique(array_map('intval', $variantIds)));
        sort($variantIds);
        $qty = max(1, min(99, $qty));
        $addonQtys = $this->normalizeAddonQuantities($product, $addonQtys, $qty);
        $addonIds = array_keys($addonQtys);
        $note = $note !== null ? trim($note) : null;
        $note = $note === '' ? null : $note;

        $availableVariantIds = array_map('intval', $product->variants->pluck('id')->all());

        foreach ($variantIds as $variantId) {
            if (! in_array($variantId, $availableVariantIds, true)) {
                throw ProductUnavailableException::because($product->name);
            }
        }

        return DB::transaction(function () use ($cart, $item, $variantIds, $addonQtys, $addonIds, $qty, $note): CartItem {
            /** @var Cart $lockedCart */
            $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();

            /** @var CartItem $lockedItem */
            $lockedItem = $lockedCart->items()
                ->whereKey($item->id)
                ->with('addons')
                ->firstOrFail();

            // Perubahan add-on bisa membuat baris ini sama dengan baris lain;
            // gabungkan qty ke baris tersebut lalu hapus baris lama.
            /** @var CartItem|null $duplicate */
            $duplicate = $lockedCart->items()
                ->where('id', '!=', $lockedItem->id)
                ->where('product_id', $lockedItem->product_id)
                ->with('addons')
                ->get()
                ->first(fn (CartItem $candidate): bool => $this->matchesConfiguration(
                    $candidate,
                    $variantIds,
                    $addonIds,
                    $note,
                ));

            if ($duplicate !== null) {
                $duplicate->update(['qty' => min(99, $duplicate->qty + $qty)]);
                $this->mergeAddonQuantities($duplicate, $addonQtys);
                $duplicate->load('product.variants', 'product.addonGroups', 'addons');

                $this->priceCalculator->calculateItem(
                    $this->mapper->toInput($duplicate),
                    $this->storeSettings->minItemPrice()
                );

                $lockedItem->delete();
                $this->touch($lockedCart);

                return $duplicate;
            }

            $lockedItem->update([
                'product_variant_ids' => $variantIds,
                'qty' => $qty,
                'note' => $note,
            ]);

            $this->syncAddonQuantities($lockedItem, $addonQtys);
            $lockedItem->load('product.variants', 'product.addonGroups', 'addons');

            $this->priceCalculator->calculateItem(
                $this->mapper->toInput($lockedItem),
                $this->storeSettings->minItemPrice()
            );

            $this->touch($lockedCart);

            return $lockedItem;
        });
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
            $inputs[] = $this->mapper->toDisplayInput($item);
        }

        return $this->priceCalculator->calculateDisplay($inputs, $this->storeSettings->minItemPrice());
    }

    public function calculateStrict(Cart $cart): PricingResult
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

    /**
     * @param  array<int, int>  $addonQtys
     * @return array<int, int>
     */
    private function normalizeAddonQuantities(?Product $product, array $addonQtys, int $qty): array
    {
        $qty = max(1, $qty);
        $normalized = [];

        foreach ($addonQtys as $addonId => $addonQty) {
            $addonId = (int) $addonId;

            if ($addonId <= 0) {
                continue;
            }

            $normalized[$addonId] = max(1, min((int) $addonQty, $qty));
        }

        if ($normalized === [] || $product === null) {
            ksort($normalized);

            return $normalized;
        }

        $groupByAddon = Addon::query()
            ->whereIn('id', array_keys($normalized))
            ->pluck('addon_group_id', 'id');

        $requiredGroupIds = $product->addonGroups
            ->where('min_select', '>', 0)
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        foreach ($normalized as $addonId => $addonQty) {
            if (in_array((int) ($groupByAddon[$addonId] ?? 0), $requiredGroupIds, true)) {
                $normalized[$addonId] = $qty;
            }
        }

        ksort($normalized);

        return $normalized;
    }

    /**
     * @param  array<int, int>  $addonQtys
     */
    private function syncAddonQuantities(CartItem $item, array $addonQtys): void
    {
        $payload = [];

        foreach ($addonQtys as $addonId => $addonQty) {
            $payload[(int) $addonId] = ['qty' => (int) $addonQty];
        }

        $item->addons()->sync($payload);
        $item->unsetRelation('addons');
    }

    /**
     * Menjumlahkan jumlah add-on saat dua baris dengan konfigurasi sama digabung.
     *
     * @param  array<int, int>  $addonQtys
     */
    private function mergeAddonQuantities(CartItem $item, array $addonQtys): void
    {
        $existing = $item->addons
            ->mapWithKeys(fn ($addon): array => [(int) $addon->id => (int) ($addon->pivot->qty ?? 1)])
            ->all();

        foreach ($existing as $addonId => $addonQty) {
            $addonQtys[$addonId] = ($addonQtys[$addonId] ?? 0) + $addonQty;
        }

        $item->loadMissing('product.addonGroups');

        $this->syncAddonQuantities(
            $item,
            $this->normalizeAddonQuantities($item->product, $addonQtys, $item->qty)
        );
    }

    /**
     * @param  list<int>  $variantIds
     * @param  list<int>  $addonIds
     */
    private function matchesConfiguration(
        CartItem $item,
        array $variantIds,
        array $addonIds,
        ?string $note,
    ): bool {
        $storedVariants = array_map('intval', $item->product_variant_ids ?? []);
        sort($storedVariants);

        if ($storedVariants !== $variantIds) {
            return false;
        }

        $storedAddons = $item->addons
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->sort()
            ->values()
            ->all();

        if ($storedAddons !== $addonIds) {
            return false;
        }

        return ($item->note ?? null) === $note;
    }
}
