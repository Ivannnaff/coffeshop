<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Category;
use App\Models\DeliveryZone;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StoreSetting;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Store Settings
        StoreSetting::updateOrCreate(
            ['store_id' => 1],
            [
                'name' => 'Coffee Shop Menanti',
                'address' => 'Jl. Contoh No. 123, Semarang',
                'latitude' => -6.9932,
                'longitude' => 110.4203,
                'opening_time' => '08:00:00',
                'closing_time' => '22:00:00',
                'timezone' => 'Asia/Jakarta',
                'is_accepting_orders' => true,
                'payment_expiry_minutes' => 15,
                'delivery_min_item_price' => 15000,
            ]
        );

        // 2. Users (Admin & Barista)
        User::updateOrCreate(
            ['email' => 'admin@menanti.test'],
            [
                'name' => 'Admin Menanti',
                'password' => Hash::make('password12345'),
                'role' => Role::Admin,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'barista@menanti.test'],
            [
                'name' => 'Barista Menanti',
                'password' => Hash::make('password12345'),
                'role' => Role::Barista,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Categories
        $catCoffee = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1, 'is_active' => true]);
        $catNonCoffee = Category::create(['name' => 'Non-Coffee', 'slug' => 'non-coffee', 'sort_order' => 2, 'is_active' => true]);
        $catSnack = Category::create(['name' => 'Snacks', 'slug' => 'snacks', 'sort_order' => 3, 'is_active' => true]);

        // 4. Products - Coffee
        $products = [
            ['cat' => $catCoffee, 'name' => 'Es Kopi Susu Menanti', 'slug' => 'es-kopi-susu-menanti', 'desc' => 'Espresso dengan susu segar dan gula aren khas.', 'price' => 14000, 'badge' => 'best_seller', 'sold' => false],
            ['cat' => $catCoffee, 'name' => 'Americano', 'slug' => 'americano', 'desc' => 'Espresso dengan air panas.', 'price' => 18000, 'badge' => null, 'sold' => false],
            ['cat' => $catCoffee, 'name' => 'Latte', 'slug' => 'latte', 'desc' => 'Espresso dengan susu steamed yang lembut.', 'price' => 20000, 'badge' => 'promo', 'sold' => false],
            ['cat' => $catCoffee, 'name' => 'Affogato', 'slug' => 'affogato', 'desc' => 'Espresso dengan satu scoop es krim vanilla.', 'price' => 25000, 'badge' => null, 'sold' => true],
        ];

        foreach ($products as $p) {
            $prod = Product::create([
                'category_id' => $p['cat']->id,
                'name' => $p['name'],
                'slug' => $p['slug'],
                'description' => $p['desc'],
                'base_price' => $p['price'],
                'badge' => $p['badge'],
                'is_sold_out' => $p['sold'],
                'is_active' => true,
                'sort_order' => 1,
            ]);
            
            // Add variants
            ProductVariant::create(['product_id' => $prod->id, 'type' => 'size', 'name' => 'Regular', 'price_delta' => 0, 'is_default' => true, 'sort_order' => 1]);
            ProductVariant::create(['product_id' => $prod->id, 'type' => 'size', 'name' => 'Large', 'price_delta' => 4000, 'is_default' => false, 'sort_order' => 2]);
        }

        // 5. Products - Non-Coffee
        $ncProducts = [
            ['cat' => $catNonCoffee, 'name' => 'Matchalicious', 'slug' => 'matchalicious', 'desc' => 'Matcha premium dengan susu segar.', 'price' => 20000, 'badge' => null, 'sold' => false],
            ['cat' => $catNonCoffee, 'name' => 'Chocolate', 'slug' => 'chocolate', 'desc' => 'Coklat belgian pilihan.', 'price' => 19000, 'badge' => 'best_seller', 'sold' => false],
        ];
        
        foreach ($ncProducts as $p) {
            Product::create([
                'category_id' => $p['cat']->id,
                'name' => $p['name'],
                'slug' => $p['slug'],
                'description' => $p['desc'],
                'base_price' => $p['price'],
                'badge' => $p['badge'],
                'is_sold_out' => $p['sold'],
                'is_active' => true,
                'sort_order' => 1,
            ]);
        }

        // 6. Add-on Groups & Addons
        $groupSugar = AddonGroup::create(['name' => 'Sugar Level', 'selection_type' => 'single', 'min_select' => 1, 'max_select' => 1, 'is_active' => true]);
        foreach (['Normal Sugar', 'Less Sugar', 'No Sugar'] as $name) {
            Addon::create(['addon_group_id' => $groupSugar->id, 'name' => $name, 'price_delta' => 0, 'is_active' => true, 'sort_order' => 1]);
        }

        $groupExtra = AddonGroup::create(['name' => 'Extra Topping', 'selection_type' => 'multiple', 'min_select' => 0, 'max_select' => 3, 'is_active' => true]);
        Addon::create(['addon_group_id' => $groupExtra->id, 'name' => 'Extra Shot', 'price_delta' => 5000, 'is_active' => true, 'sort_order' => 1]);
        Addon::create(['addon_group_id' => $groupExtra->id, 'name' => 'Jelly', 'price_delta' => 4000, 'is_active' => true, 'sort_order' => 2]);

        // Link addons to products
        Product::all()->each(function ($p) use ($groupSugar, $groupExtra) {
            $p->addonGroups()->attach([$groupSugar->id, $groupExtra->id]);
        });

        // 7. Tables & Delivery
        for ($i = 1; $i <= 5; $i++) {
            Table::create(['store_id' => 1, 'number' => "A{$i}", 'qr_token' => Str::random(48), 'is_active' => true]);
        }

        DeliveryZone::create(['store_id' => 1, 'name' => 'Zona 1', 'max_distance_km' => 3.00, 'base_fee' => 10000, 'free_fee_min_subtotal' => 50000, 'sort_order' => 1, 'is_active' => true]);
    }
}
