<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Pricing\DTO\AddonChoice;
use App\Domain\Pricing\DTO\AddonGroupRule;
use App\Domain\Pricing\DTO\CartItemInput;
use App\Domain\Pricing\DTO\VariantChoice;
use App\Domain\Pricing\PriceCalculator;
use App\Enums\AddonSelectionType;
use App\Enums\VariantType;
use PHPUnit\Framework\TestCase;

class PriceCalculatorTest extends TestCase
{
    protected PriceCalculator $calculator;

    protected int $minItemPrice = 15000;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new PriceCalculator;
    }

    public function test_case_1_base_price_without_addon(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Es Kopi Susu',
            basePrice: 14000,
            qty: 1,
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(14000, $result->unitPrice);
        $this->assertFalse($result->isDeliveryEligible);
        $this->assertEquals(14000, $result->lineTotal);
    }

    public function test_case_2_with_extra_shot(): void
    {
        $group = new AddonGroupRule(id: 1, name: 'Topping', selectionType: AddonSelectionType::Multiple, minSelect: 0, maxSelect: 2);
        $addon = new AddonChoice(id: 1, groupId: 1, name: 'Extra Shot', priceDelta: 5000);

        $item = new CartItemInput(
            productId: 1,
            productName: 'Es Kopi Susu',
            basePrice: 14000,
            qty: 1,
            addons: [$addon],
            addonGroups: [$group],
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(19000, $result->unitPrice);
        $this->assertTrue($result->isDeliveryEligible);
    }

    public function test_case_3_qty_does_not_affect_eligibility(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Es Kopi Susu',
            basePrice: 14000,
            qty: 2,
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(14000, $result->unitPrice);
        $this->assertFalse($result->isDeliveryEligible);
        $this->assertEquals(28000, $result->lineTotal);
    }

    public function test_case_4_exact_boundary_15000(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Kopi Pas',
            basePrice: 15000,
            qty: 1,
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(15000, $result->unitPrice);
        $this->assertTrue($result->isDeliveryEligible);
    }

    public function test_case_5_just_below_boundary_14999(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Kopi Hampir',
            basePrice: 14999,
            qty: 1,
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(14999, $result->unitPrice);
        $this->assertFalse($result->isDeliveryEligible);
    }

    public function test_case_6_large_size_variant(): void
    {
        $variant = new VariantChoice(id: 1, type: VariantType::Size, name: 'Large', priceDelta: 3000);

        $item = new CartItemInput(
            productId: 1,
            productName: 'Es Kopi Susu',
            basePrice: 14000,
            qty: 1,
            variants: [$variant],
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(17000, $result->unitPrice);
        $this->assertEquals('Large', $result->sizeName);
        $this->assertTrue($result->isDeliveryEligible);
    }

    public function test_case_7_negative_variant_delta(): void
    {
        $variant = new VariantChoice(id: 1, type: VariantType::Size, name: 'Mini', priceDelta: -2000);

        $item = new CartItemInput(
            productId: 1,
            productName: 'Es Kopi Susu',
            basePrice: 14000,
            qty: 1,
            variants: [$variant],
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(12000, $result->unitPrice);
        $this->assertFalse($result->isDeliveryEligible);
    }

    public function test_case_8_promo_calculated_before_eligibility(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Kopi Promo',
            basePrice: 20000,
            qty: 1,
            promoDiscountPerUnit: 6000, // 20.000 - 6.000 = 14.000
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(14000, $result->unitPrice);
        $this->assertFalse($result->isDeliveryEligible);
    }

    public function test_case_9_mixed_items(): void
    {
        $item1 = new CartItemInput(
            productId: 1,
            productName: 'Eligible Item',
            basePrice: 19000,
            qty: 1,
        );

        $item2 = new CartItemInput(
            productId: 2,
            productName: 'Ineligible Item',
            basePrice: 12000,
            qty: 2, // 2 * 12.000 = 24.000 line total
        );

        $result = $this->calculator->calculate([$item1, $item2], $this->minItemPrice);

        $this->assertEquals(43000, $result->subtotal); // 19.000 + 24.000
        $this->assertEquals(19000, $result->eligibleSubtotal); // hanya item1 yang unitPrice (19k) >= 15k
    }

    public function test_case_10_negative_price_clamped_to_zero(): void
    {
        $item = new CartItemInput(
            productId: 1,
            productName: 'Kopi Diskon Besar',
            basePrice: 15000,
            qty: 1,
            promoDiscountPerUnit: 20000, // Diskon melebihi harga
        );

        $result = $this->calculator->calculateItem($item, $this->minItemPrice);

        $this->assertEquals(0, $result->unitPrice);
        $this->assertTrue($result->priceClamped);
        $this->assertFalse($result->isDeliveryEligible);
    }
}
