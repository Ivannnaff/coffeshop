<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Table;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Table>
 */
class TableFactory extends Factory
{
    public function definition(): array
    {
        return [
            'store_id' => 1,
            'number' => strtoupper(fake()->unique()->bothify('?#')),
            'qr_token' => Str::random(48),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
