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
     * Menghitung satu item keranjang menjadi snapshot harga secara ketat (untuk checkout).
     */
    public function calculateItem(CartItemInput $item, int $deliveryMinItemPrice): PricedItem
    {
        if ($item->qty < 1) {
            throw new InvalidArgumentException('Qty minimal 1.');
        }

        if (! $item->isActive || $item->isSoldOut) {
            throw ProductUnavailableException::because($item->productName);
        }

        if ($item->unavailableReason !== null) {
            throw ProductUnavailableException::because($item->productName);
        }

        foreach ($item->addons as $addon) {
            if (! $addon->isActive || $addon->isSoldOut) {
                throw ProductUnavailableException::because($item->productName);
            }
        }

        $this->addonValidator->validate($item);

        return $this->computePricedItem($item, $deliveryMinItemPrice, true, null);
    }

    /**
     * Menghitung satu item keranjang untuk ditampilkan di keranjang tanpa melempar exception (B-02).
     */
    public function calculateItemDisplay(CartItemInput $item, int $deliveryMinItemPrice): PricedItem
    {
        if ($item->qty < 1) {
            return $this->computePricedItem($item, $deliveryMinItemPrice, false, 'Kuantitas tidak valid.');
        }

        if (! $item->isActive) {
            return $this->computePricedItem($item, $deliveryMinItemPrice, false, 'Produk sudah tidak aktif.');
        }

        if ($item->isSoldOut) {
            return $this->computePricedItem($item, $deliveryMinItemPrice, false, 'Produk sedang habis (sold out).');
        }

        if ($item->unavailableReason !== null) {
            return $this->computePricedItem($item, $deliveryMinItemPrice, false, $item->unavailableReason);
        }

        foreach ($item->addons as $addon) {
            if (! $addon->isActive || $addon->isSoldOut) {
                return $this->computePricedItem($item, $deliveryMinItemPrice, false, "Add-on '{$addon->name}' sudah tidak tersedia.");
            }
        }

        try {
            $this->addonValidator->validate($item);
        } catch (\Throwable) {
            return $this->computePricedItem($item, $deliveryMinItemPrice, false, 'Pilihan add-on tidak valid.');
        }

        return $this->computePricedItem($item, $deliveryMinItemPrice, true, null);
    }

    private function computePricedItem(
        CartItemInput $item,
        int $deliveryMinItemPrice,
        bool $isAvailable,
        ?string $unavailableReason
    ): PricedItem {
        $variantDelta = 0;
        $sizeName = null;
        $temperatureName = null;
        $usedTypes = [];
        $seenVariantIds = [];

        foreach ($item->variants as $variant) {
            if (isset($seenVariantIds[$variant->id])) {
                throw new InvalidArgumentException('Varian yang sama tidak boleh dipilih dua kali.');
            }
            $seenVariantIds[$variant->id] = true;

            $type = $variant->type;
            if (isset($usedTypes[$type->value])) {
                throw new InvalidArgumentException('Hanya boleh satu varian untuk setiap tipe.');
            }
            $usedTypes[$type->value] = true;

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

        $unitPrice = $isAvailable ? ($grossPrice - $discountAmount) : 0;
        $priceClamped = false;

        if ($isAvailable && $grossPrice - $item->promoDiscountPerUnit < 0) {
            $discountAmount = $grossPrice;
            $unitPrice = 0;
            $priceClamped = true;
        }

        $lineTotal = $isAvailable ? ($unitPrice * $item->qty) : 0;

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
            lineTotal: $lineTotal,
            isDeliveryEligible: $isAvailable && $this->isDeliveryEligible($unitPrice, $deliveryMinItemPrice),
            addons: $item->addons,
            note: $item->note,
            priceClamped: $priceClamped,
            cartItemId: $item->cartItemId,
            isAvailable: $isAvailable,
            unavailableReason: $unavailableReason,
        );
    }

    /**
     * Menghitung seluruh item keranjang dan totalnya secara ketat (untuk checkout).
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
     * Menghitung seluruh item keranjang untuk ditampilkan di keranjang (B-02).
     *
     * @param  list<CartItemInput>  $items
     */
    public function calculateDisplay(array $items, int $deliveryMinItemPrice): PricingResult
    {
        $pricedItems = [];
        $subtotal = 0;
        $eligibleSubtotal = 0;
        $anomalies = [];

        foreach ($items as $item) {
            $pricedItem = $this->calculateItemDisplay($item, $deliveryMinItemPrice);

            $pricedItems[] = $pricedItem;
            if ($pricedItem->isAvailable) {
                $subtotal += $pricedItem->lineTotal;

                if ($pricedItem->isDeliveryEligible) {
                    $eligibleSubtotal += $pricedItem->lineTotal;
                }
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
