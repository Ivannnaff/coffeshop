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

/**
 * Memetakan model keranjang ke DTO domain agar PriceCalculator tetap murni.
 */
final class CartItemMapper
{
    public function toInput(CartItem $item): CartItemInput
    {
        $product = $item->product;

        if ($product === null) {
            throw ProductUnavailableException::because('Produk');
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

        // Varian yang dipilih pelanggan sudah tidak ada lagi di katalog.
        if (count($variants) !== count($variantIds)) {
            throw ProductUnavailableException::because($product->name);
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

        $addons = [];
        $addonIds = $item->addons()->pluck('addons.id')->all();

        if ($addonIds !== []) {
            $selectedAddons = Addon::query()->withTrashed()->whereIn('id', $addonIds)->get();

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
        );
    }
}
