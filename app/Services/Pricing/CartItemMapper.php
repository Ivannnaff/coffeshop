<?php

declare(strict_types=1);

namespace App\Services\Pricing;

use App\Domain\Pricing\DTO\AddonChoice;
use App\Domain\Pricing\DTO\AddonGroupRule;
use App\Domain\Pricing\DTO\CartItemInput;
use App\Domain\Pricing\DTO\VariantChoice;
use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Models\Addon;
use App\Models\CartItem;
use Illuminate\Support\Facades\DB;

/**
 * Memetakan model keranjang ke DTO domain agar PriceCalculator tetap murni.
 *
 * `toInput()` bersifat ketat dan dipakai saat checkout: item yang tidak
 * tersedia langsung menjadi exception. `toDisplayInput()` bersifat longgar
 * dan dipakai saat menampilkan keranjang: item bermasalah ditandai
 * `unavailableReason` agar satu item rusak tidak memblokir seluruh respons.
 */
final class CartItemMapper
{
    public function toInput(CartItem $item): CartItemInput
    {
        return $this->map($item, lenient: false);
    }

    public function toDisplayInput(CartItem $item): CartItemInput
    {
        return $this->map($item, lenient: true);
    }

    private function map(CartItem $item, bool $lenient): CartItemInput
    {
        $product = $item->product;

        if ($product === null) {
            if (! $lenient) {
                throw ProductUnavailableException::because('Produk');
            }

            return new CartItemInput(
                productId: 0,
                productName: 'Produk tidak tersedia',
                basePrice: 0,
                qty: $item->qty,
                isActive: false,
                note: $item->note,
                cartItemId: $item->id,
                unavailableReason: 'Produk sudah dihapus dari katalog.',
            );
        }

        $variantIds = $item->product_variant_ids;
        $variants = [];

        foreach ($product->variants as $variant) {
            if (in_array($variant->id, $variantIds, true)) {
                $variants[] = new VariantChoice(
                    id: $variant->id,
                    type: $variant->type,
                    name: $variant->name,
                    priceDelta: $variant->price_delta,
                );
            }
        }

        $reason = null;

        // Varian yang dipilih pelanggan sudah tidak ada lagi di katalog.
        if (count($variants) !== count($variantIds)) {
            if (! $lenient) {
                throw ProductUnavailableException::because($product->name);
            }

            $reason = 'Varian yang dipilih sudah tidak tersedia.';
        }

        $addonGroups = [];
        foreach ($product->addonGroups as $group) {
            $addonGroups[] = new AddonGroupRule(
                id: $group->id,
                name: $group->name,
                selectionType: $group->selection_type,
                minSelect: $group->min_select,
                maxSelect: $group->max_select,
            );
        }

        [$addons, $missingAddons] = $this->addonChoices($item);

        if ($missingAddons > 0) {
            if (! $lenient) {
                throw ProductUnavailableException::because($product->name);
            }

            $reason ??= 'Add-on yang dipilih sudah tidak tersedia.';
        }

        return new CartItemInput(
            productId: $product->id,
            productName: $product->name,
            basePrice: $product->base_price,
            qty: $item->qty,
            variants: $variants,
            addons: $addons,
            addonGroups: $addonGroups,
            promoDiscountPerUnit: 0,
            isActive: $product->is_active,
            isSoldOut: $product->is_sold_out,
            note: $item->note,
            cartItemId: $item->id,
            unavailableReason: $reason,
        );
    }

    /**
     * Add-on diambil dari pivot agar add-on yang sudah di-soft-delete tetap
     * terdeteksi (relasi Eloquent default menyembunyikannya).
     *
     * @return array{0: list<AddonChoice>, 1: int}
     */
    private function addonChoices(CartItem $item): array
    {
        $addonIds = DB::table('cart_item_addons')
            ->where('cart_item_id', $item->id)
            ->pluck('addon_id')
            ->all();

        if ($addonIds === []) {
            return [[], 0];
        }

        $selectedAddons = Addon::query()->withTrashed()->whereIn('id', $addonIds)->get();
        $addons = [];

        foreach ($selectedAddons as $addon) {
            $addons[] = new AddonChoice(
                id: $addon->id,
                groupId: $addon->addon_group_id,
                name: $addon->name,
                priceDelta: $addon->price_delta,
                isActive: $addon->is_active && ! $addon->trashed(),
                isSoldOut: $addon->is_sold_out,
            );
        }

        return [$addons, count($addonIds) - $selectedAddons->count()];
    }
}
