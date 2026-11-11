<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(20000, 150000);

        return [
            'store_id' => 1,
            'order_number' => 'MNT-'.now()->format('ymd').'-'.fake()->unique()->numerify('####'),
            'public_token' => Str::random(48),
            'mode' => 'takeaway',
            'status' => 'PENDING_PAYMENT',
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->numerify('08##########'),
            'subtotal' => $subtotal,
            'eligible_subtotal' => $subtotal,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => $subtotal,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(15),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'PAID',
            'paid_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'EXPIRED',
            'expires_at' => now()->subMinute(),
        ]);
    }

    public function delivery(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => 'delivery',
            'delivery_address' => fake()->address(),
            'delivery_latitude' => -6.9932,
            'delivery_longitude' => 110.4203,
            'delivery_distance_km' => 2.4,
        ]);
    }
}
