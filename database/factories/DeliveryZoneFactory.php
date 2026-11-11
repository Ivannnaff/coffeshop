<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DeliveryZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryZone>
 */
class DeliveryZoneFactory extends Factory
{
    public function definition(): array
    {
        $maxDistance = fake()->randomElement([3, 5, 8, 12]);

        return [
            'store_id' => 1,
            'name' => "Zona {$maxDistance} km",
            'max_distance_km' => $maxDistance,
            'base_fee' => fake()->randomElement([8000, 10000, 13000, 18000]),
            'free_fee_min_subtotal' => null,
            'sort_order' => $maxDistance,
            'is_active' => true,
        ];
    }
}
