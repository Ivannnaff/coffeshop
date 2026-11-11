<?php

declare(strict_types=1);

namespace App\Domain\Pricing;

use App\Domain\Pricing\DTO\CartItemInput;
use App\Domain\Pricing\DTO\PricedItem;
use App\Domain\Pricing\DTO\PricingResult;
use App\Domain\Pricing\Exceptions\ProductUnavailableException;
use App\Enums\VariantType;
use InvalidArgumentException;

/**
 * Mesin harga sesuai 04-BUSINESS-RULES.md bagian 3.
 * Domain ini murni PHP dan tidak bergantung pada Eloquent.
 */
final class PriceCalculator
{
    public function __construct(
        private readonly AddonSelectionValidator $addonValidator = new AddonSelectionValidator
    ) {}

    /**
     * Menghitung satu item keranjang menjadi snapshot harga.
     */
    public function calculateItem(CartItemInput $item, int $deliveryMinItemPrice): PricedItem
    {
        if ($item->qty < 1) {
            throw new InvalidArgumentException('Qty minimal 1.');
        }

        if (! $item->isActive || $item->isSoldOut) {
            throw ProductUnavailableException::because($item->productName);
        }

        $this->addonValidator->validate($item);

        $variantDelta = 0;
        $sizeName = null;
        $temperatureName = null;

        foreach ($item->variants as $variant) {
            $variantDelta += $variant->priceDelta;

            if ($variant->type === VariantType::Size) {
                $sizeName = $variant->name;
            }

            if ($variant->type === VariantType::Temperature) {
                $temperatureName = $variant->name;
            }
        }

        $addonsTotal = 0;
        foreach ($item->addons as $addon) {
            $addonsTotal += $addon->priceDelta;
        }

        $grossPrice = $item->basePrice + $variantDelta + $addonsTotal;
        $discountAmount = max(0, $item->promoDiscountPerUnit);
        $anomaly = null;

        $unitPrice = $grossPrice - $discountAmount;
        $priceClamped = false;

        if ($grossPrice - $item->promoDiscountPerUnit < 0) {
            $discountAmount = $grossPrice;
            $unitPrice = 0;
            $priceClamped = true;
        }

        return new PricedItem(
            productId: $item->productId,
            productName: $item->productName,
            sizeName: $sizeName,
            temperatureName: $temperatureName,
            basePrice: $item->basePrice,
            variantDelta: $variantDelta,
            addonsTotal: $addonsTotal,
            discountAmount: $discountAmount,
            unitPrice: $unitPrice,
            qty: $item->qty,
            lineTotal: $unitPrice * $item->qty,
            isDeliveryEligible: $this->isDeliveryEligible($unitPrice, $deliveryMinItemPrice),
            addons: $item->addons,
            note: $item->note,
            priceClamped: $priceClamped,
            cartItemId: $item->cartItemId,
        );
    }

    /**
     * Menghitung seluruh item keranjang dan totalnya.
     *
     * @param  list<CartItemInput>  $items
     */
    public function calculate(array $items, int $deliveryMinItemPrice): PricingResult
    {
        $pricedItems = [];
        $subtotal = 0;
        $eligibleSubtotal = 0;
        $anomalies = [];

        foreach ($items as $item) {
            $pricedItem = $this->calculateItem($item, $deliveryMinItemPrice);

            $pricedItems[] = $pricedItem;
            $subtotal += $pricedItem->lineTotal;

            if ($pricedItem->isDeliveryEligible) {
                $eligibleSubtotal += $pricedItem->lineTotal;
            }

            // Anomali harga negatif dideteksi ulang agar tetap tercatat di hasil agregat.
            $grossPrice = $pricedItem->basePrice + $pricedItem->variantDelta + $pricedItem->addonsTotal;

            if ($item->promoDiscountPerUnit > $grossPrice) {
                $anomalies[] = "Harga unit produk '{$item->productName}' negatif, di-clamp ke 0.";
            }
        }

        return new PricingResult(
            items: $pricedItems,
            subtotal: $subtotal,
            eligibleSubtotal: $eligibleSubtotal,
            anomalies: $anomalies,
            minItemPrice: $deliveryMinItemPrice,
        );
    }

    /**
     * Kelayakan diskon ongkir dinilai per unit, bukan per baris.
     * Lihat 04-BUSINESS-RULES.md bagian 4.2.
     */
    public function isDeliveryEligible(int $unitPrice, int $deliveryMinItemPrice): bool
    {
        return $unitPrice >= $deliveryMinItemPrice;
    }
}
