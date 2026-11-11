<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'base_price' => fake()->randomElement([14000, 16000, 18000, 22000, 25000]),
            'image_path' => null,
            'is_sold_out' => false,
            'is_active' => true,
            'badge' => null,
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }

    public function soldOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_sold_out' => true,
        ]);
    }

    public function promo(): static
    {
        return $this->state(fn (array $attributes) => [
            'badge' => 'promo',
        ]);
    }

    public function bestSeller(): static
    {
        return $this->state(fn (array $attributes) => [
            'badge' => 'best_seller',
        ]);
    }
}
