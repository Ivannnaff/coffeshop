<?php

declare(strict_types=1);

namespace App\Domain\Delivery;

use App\Domain\Delivery\DTO\DeliveryZoneItem;
use App\Domain\Delivery\Exceptions\OutOfDeliveryAreaException;

final class DeliveryZoneResolver
{
    /**
     * Memilih zona aktif pertama yang max_distance_km >= jarak.
     * Lihat 04-BUSINESS-RULES.md bagian 4.1.
     *
     * @param  list<DeliveryZoneItem>  $zones
     */
    public function resolve(float $distanceKm, array $zones): DeliveryZoneItem
    {
        $activeZones = array_values(array_filter(
            $zones,
            fn (DeliveryZoneItem $zone): bool => $zone->isActive
        ));

        usort(
            $activeZones,
            fn (DeliveryZoneItem $a, DeliveryZoneItem $b): int => $a->maxDistanceKm <=> $b->maxDistanceKm
        );

        foreach ($activeZones as $zone) {
            if ($zone->maxDistanceKm >= $distanceKm) {
                return $zone;
            }
        }

        throw OutOfDeliveryAreaException::because();
    }
}
