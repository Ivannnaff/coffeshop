<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\VariantType;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'type' => VariantType::Size,
            'name' => 'Regular',
            'price_delta' => 0,
            'is_default' => true,
            'sort_order' => 0,
        ];
    }

    public function size(string $name, int $priceDelta = 0): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => VariantType::Size,
            'name' => $name,
            'price_delta' => $priceDelta,
        ]);
    }

    public function temperature(string $name, int $priceDelta = 0): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => VariantType::Temperature,
            'name' => $name,
            'price_delta' => $priceDelta,
        ]);
    }
}
