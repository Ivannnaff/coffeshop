<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AddonSelectionType;
use App\Models\AddonGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AddonGroup>
 */
class AddonGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'selection_type' => AddonSelectionType::Multiple,
            'min_select' => 0,
            'max_select' => null,
            'is_active' => true,
        ];
    }

    public function single(int $minSelect = 1): static
    {
        return $this->state(fn (array $attributes) => [
            'selection_type' => AddonSelectionType::Single,
            'min_select' => $minSelect,
            'max_select' => 1,
        ]);
    }
}
