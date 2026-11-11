<?php

declare(strict_types=1);

namespace App\Domain\Delivery;

/**
 * Perhitungan jarak garis lurus (Haversine).
 * Metode distance provider masih terbuka di 11-DECISIONS.md (T-2).
 */
final class GeoDistanceCalculator
{
    private const EARTH_RADIUS_KM = 6371.0;

    public function distanceKm(
        float $originLatitude,
        float $originLongitude,
        float $destinationLatitude,
        float $destinationLongitude,
    ): float {
        $latitudeDelta = deg2rad($destinationLatitude - $originLatitude);
        $longitudeDelta = deg2rad($destinationLongitude - $originLongitude);

        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($originLatitude))
            * cos(deg2rad($destinationLatitude))
            * sin($longitudeDelta / 2) ** 2;

        return self::EARTH_RADIUS_KM * 2 * asin(min(1.0, sqrt($a)));
    }
}
