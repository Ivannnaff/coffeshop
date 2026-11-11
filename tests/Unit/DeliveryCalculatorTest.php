<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Delivery\DeliveryFeeCalculator;
use App\Domain\Delivery\DeliveryZoneResolver;
use App\Domain\Delivery\DTO\DeliveryFeeRuleDefinition;
use App\Domain\Delivery\DTO\DeliveryZoneItem;
use App\Domain\Delivery\Exceptions\OutOfDeliveryAreaException;
use App\Domain\Delivery\GeoDistanceCalculator;
use App\Enums\DeliveryDiscountType;
use PHPUnit\Framework\TestCase;

class DeliveryCalculatorTest extends TestCase
{
    public function test_resolves_correct_zone_by_distance(): void
    {
        $zones = [
            new DeliveryZoneItem(id: 1, name: 'Zona 1', maxDistanceKm: 3.0, baseFee: 10000, freeFeeMinSubtotal: 50000),
            new DeliveryZoneItem(id: 2, name: 'Zona 2', maxDistanceKm: 6.0, baseFee: 15000, freeFeeMinSubtotal: 100000),
        ];

        $resolver = new DeliveryZoneResolver;

        // 2 km masuk zona 1
        $resolved = $resolver->resolve(2.0, $zones);
        $this->assertEquals(1, $resolved->id);

        // 3.01 km masuk zona 2
        $resolved2 = $resolver->resolve(3.01, $zones);
        $this->assertEquals(2, $resolved2->id);
    }

    public function test_throws_exception_when_out_of_delivery_area(): void
    {
        $zones = [
            new DeliveryZoneItem(id: 1, name: 'Zona 1', maxDistanceKm: 3.0, baseFee: 10000),
        ];

        $resolver = new DeliveryZoneResolver;

        $this->expectException(OutOfDeliveryAreaException::class);
        $resolver->resolve(4.5, $zones);
    }

    public function test_free_fee_when_eligible_subtotal_reaches_threshold(): void
    {
        $zone = new DeliveryZoneItem(
            id: 1,
            name: 'Zona 1',
            maxDistanceKm: 3.0,
            baseFee: 10000,
            freeFeeMinSubtotal: 50000,
        );

        $calculator = new DeliveryFeeCalculator;

        // Subtotal di bawah threshold
        $quote1 = $calculator->quote($zone, 2.0, 40000);
        $this->assertEquals(10000, $quote1->deliveryFee);
        $this->assertEquals(0, $quote1->deliveryDiscount);

        // Subtotal mencapai threshold gratis ongkir
        $quote2 = $calculator->quote($zone, 2.0, 50000);
        $this->assertEquals(0, $quote2->deliveryFee);
        $this->assertEquals(10000, $quote2->deliveryDiscount);
    }

    public function test_percent_discount_with_floor_rounding(): void
    {
        $rule = new DeliveryFeeRuleDefinition(
            minEligibleSubtotal: 30000,
            discountType: DeliveryDiscountType::Percent,
            discountValue: 33, // 33% dari 15.000 = 4.950 -> dibulatkan ke bawah oleh floor di intdiv / perhitungan
        );

        $zone = new DeliveryZoneItem(
            id: 1,
            name: 'Zona 2',
            maxDistanceKm: 5.0,
            baseFee: 15000,
            rules: [$rule],
        );

        $calculator = new DeliveryFeeCalculator;
        $quote = $calculator->quote($zone, 4.0, 35000);

        // 15000 * 33 / 100 = 4950
        $this->assertEquals(4950, $quote->deliveryDiscount);
        $this->assertEquals(10050, $quote->deliveryFee);
    }

    public function test_haversine_distance_calculation(): void
    {
        $geo = new GeoDistanceCalculator;
        // Toko di -6.9932, 110.4203. Titik lain dekat.
        $distance = $geo->distanceKm(-6.9932, 110.4203, -6.9832, 110.4203);
        $this->assertGreaterThan(1.0, $distance);
        $this->assertLessThan(1.5, $distance);
    }
}
