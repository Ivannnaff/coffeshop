<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Addon;
use App\Models\AddonGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Addon>
 */
class AddonFactory extends Factory
{
    public function definition(): array
    {
        return [
            'addon_group_id' => AddonGroup::factory(),
            'name' => fake()->unique()->words(2, true),
            'price_delta' => fake()->randomElement([0, 3000, 5000, 8000]),
            'is_sold_out' => false,
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }

    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'price_delta' => 0,
        ]);
    }

    public function soldOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_sold_out' => true,
        ]);
    }
}
