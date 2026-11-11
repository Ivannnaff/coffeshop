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

        // 3. Categories & Products
        $catCoffee = Category::create([
            'name' => 'Coffee',
            'slug' => 'coffee',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $catNonCoffee = Category::create([
            'name' => 'Non-Coffee',
            'slug' => 'non-coffee',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $catSnack = Category::create([
            'name' => 'Snacks',
            'slug' => 'snacks',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        // Product 1: Es Kopi Susu Menanti (Base 14.000 -> di bawah ambang 15k, tapi dengan variant/addon bisa memenuhi)
        $p1 = Product::create([
            'category_id' => $catCoffee->id,
            'name' => 'Es Kopi Susu Menanti',
            'slug' => 'es-kopi-susu-menanti',
            'description' => 'Espresso dengan susu segar dan gula aren khas Menanti.',
            'base_price' => 14000,
            'is_sold_out' => false,
            'is_active' => true,
            'badge' => 'best_seller',
            'sort_order' => 1,
        ]);

        // Variants for Product 1
        ProductVariant::create([
            'product_id' => $p1->id,
            'type' => 'size',
            'name' => 'Regular',
            'price_delta' => 0,
            'is_default' => true,
            'sort_order' => 1,
        ]);
        ProductVariant::create([
            'product_id' => $p1->id,
            'type' => 'size',
            'name' => 'Large',
            'price_delta' => 4000,
            'is_default' => false,
            'sort_order' => 2,
        ]);
        ProductVariant::create([
            'product_id' => $p1->id,
            'type' => 'temperature',
            'name' => 'Iced',
            'price_delta' => 0,
            'is_default' => true,
            'sort_order' => 1,
        ]);

        // Product 2: Manual Brew V60 (Base 22.000 -> eligible)
        $p2 = Product::create([
            'category_id' => $catCoffee->id,
            'name' => 'Manual Brew V60',
            'slug' => 'manual-brew-v60',
            'description' => 'Kopi seduh manual pilihan biji kopi single origin nusantara.',
            'base_price' => 22000,
            'is_sold_out' => false,
            'is_active' => true,
            'badge' => 'promo',
            'sort_order' => 2,
        ]);

        // Product 3: Matchalicious (Base 20.000 -> eligible)
        $p3 = Product::create([
            'category_id' => $catNonCoffee->id,
            'name' => 'Matchalicious',
            'slug' => 'matchalicious',
            'description' => 'Green tea matcha premium jepang dengan susu segar.',
            'base_price' => 20000,
            'is_sold_out' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // 4. Add-on Groups & Addons
        $groupSugar = AddonGroup::create([
            'name' => 'Sugar Level',
            'selection_type' => 'single',
            'min_select' => 1,
            'max_select' => 1,
            'is_active' => true,
        ]);

        Addon::create([
            'addon_group_id' => $groupSugar->id,
            'name' => 'Normal Sugar',
            'price_delta' => 0,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        Addon::create([
            'addon_group_id' => $groupSugar->id,
            'name' => 'Less Sugar',
            'price_delta' => 0,
            'is_active' => true,
            'sort_order' => 2,
        ]);
        Addon::create([
            'addon_group_id' => $groupSugar->id,
            'name' => 'No Sugar',
            'price_delta' => 0,
            'is_active' => true,
            'sort_order' => 3,
        ]);

        $groupExtra = AddonGroup::create([
            'name' => 'Extra Topping',
            'selection_type' => 'multiple',
            'min_select' => 0,
            'max_select' => 3,
            'is_active' => true,
        ]);

        Addon::create([
            'addon_group_id' => $groupExtra->id,
            'name' => 'Extra Shot Espresso',
            'price_delta' => 5000,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        Addon::create([
            'addon_group_id' => $groupExtra->id,
            'name' => 'Jelly Topping',
            'price_delta' => 4000,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        // Link product 1 to addon groups
        $p1->addonGroups()->attach([$groupSugar->id, $groupExtra->id]);
        $p2->addonGroups()->attach([$groupSugar->id]);
        $p3->addonGroups()->attach([$groupSugar->id, $groupExtra->id]);

        // 5. Tables
        for ($i = 1; $i <= 5; $i++) {
            Table::create([
                'store_id' => 1,
                'number' => "A{$i}",
                'qr_token' => Str::random(48),
                'is_active' => true,
            ]);
        }

        // 6. Delivery Zones
        DeliveryZone::create([
            'store_id' => 1,
            'name' => 'Zona 1 (0 - 3 km)',
            'max_distance_km' => 3.00,
            'base_fee' => 10000,
            'free_fee_min_subtotal' => 50000,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        DeliveryZone::create([
            'store_id' => 1,
            'name' => 'Zona 2 (3.01 - 6 km)',
            'max_distance_km' => 6.00,
            'base_fee' => 15000,
            'free_fee_min_subtotal' => 100000,
            'sort_order' => 2,
            'is_active' => true,
        ]);
    }
}
