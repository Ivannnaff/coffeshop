<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenantiMenuSeeder extends Seeder
{
    /**
     * Menu asli Menanti Pagi (papan menu Coffee, Tea Series, Signature,
     * Milk Base, Choco Series, Food, Snack).
     */
    public function run(): void
    {
        $categories = [
            'coffee' => ['Coffee', 1],
            'tea-series' => ['Tea Series', 2],
            'signature' => ['Signature', 3],
            'milk-base' => ['Milk Base', 4],
            'choco-series' => ['Choco Series', 5],
            'food' => ['Food', 6],
            'snack' => ['Snack', 7],
        ];

        $categoryModels = [];

        foreach ($categories as $slug => [$name, $sortOrder]) {
            $categoryModels[$slug] = Category::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'sort_order' => $sortOrder, 'is_active' => true],
            );
        }

        Category::query()
            ->whereNotIn('slug', array_keys($categories))
            ->update(['is_active' => false]);

        $menu = [
            'coffee' => [
                ['Americano', 15000, 'Espresso blend with hot water.'],
                ['Fruity Americano', 19000, 'Espresso blend with fruity syrup.'],
                ['Cappuccino', 15000, 'Fresh milk with double espresso blend.'],
                ['Cafe Latte', 15000, 'Fresh milk with a gentle espresso blend.'],
                ['Creamy Latte', 15000, 'Creamy milk with a gentle espresso blend.'],
                ['Moccacino', 18000, 'Espresso blend with chocolate and milk.'],
                ['Kopi Susu Aren', 18000, 'Espresso blend with palm sugar.'],
                ['Caramel Latte', 18000, 'Espresso blend with caramel.'],
                ['Vanilla Latte', 18000, 'Espresso blend with vanilla syrup.'],
                ['Salted Caramel Latte', 18000, 'Espresso blend with salted caramel syrup.'],
                ['Butterscotch Latte', 18000, 'Espresso blend with butterscotch syrup.'],
                ['Hazelnut Latte', 18000, 'Espresso blend with hazelnut syrup.'],
            ],
            'tea-series' => [
                ['Lychee Tea', 12000, 'Tea with lychee.'],
                ['Strawberry Tea', 10000, 'Tea with strawberry.'],
                ['Peppermint Tea', 10000, 'Peppermint flower tea.'],
                ['Lemon Tea', 10000, 'Tea with lemon.'],
                ['Raspberry Tea', 10000, 'Tea with raspberry.'],
                ['Chamomile Flowers', 10000, 'Chamomile flower tea.'],
                ['Rosella Flowers', 10000, 'Rosella flower tea.'],
                ['Ice Tea', 10000, 'Iced tea.'],
            ],
            'signature' => [
                ['Matcha Frappucino', 20000, 'Espresso blend with matcha and fresh milk.'],
                ['Matcha Berries', 20000, 'Raspberry fruit with matcha and fresh milk.'],
                ['Choco Berries', 20000, 'Raspberry fruit mix chocolate.'],
                ['Yakult Lychee Shake', 22000, 'Yakult with lychee syrup.'],
                ['Mix Berries Squash', 20000, 'Raspberry with soda water.'],
                ['Cookies N Cream', 20000, 'Oreo with fresh milk and salty cheese.'],
                ['Dolce Caramel', 20000, 'Espresso blend with fresh milk & caramel sauce.'],
                ['Raspberry Americano', 20000, 'Espresso with raspberry fruit.'],
            ],
            'milk-base' => [
                ['Taro', 15000, 'Fresh milk with taro.'],
                ['Red Velvet', 15000, 'Fresh milk with red velvet.'],
                ['Matcha Latte', 15000, 'Smooth matcha with fresh milk.'],
                ['Vanilla Milkshake', 15000, 'Vanilla with fresh milk.'],
                ['Caramel Milkshake', 15000, 'Caramel with fresh milk.'],
                ['Gula Aren Milkshake', 15000, 'Palm sugar with fresh milk.'],
                ['Matcha Ube', 19000, 'Taro mix matcha with fresh milk.'],
            ],
            'choco-series' => [
                ['Magnum Chocolate', 18000, 'Fresh milk with chocolate and salty cheese.'],
                ['Dark Chocolate', 18000, 'Fresh milk with chocolate and salty cheese.'],
                ['Choco Vanilla', 18000, 'Chocolate with fresh milk and vanilla syrup.'],
                ['Choco Caramel', 18000, 'Chocolate with fresh milk and caramel syrup.'],
                ['Choco Mint', 18000, 'Chocolate with fresh milk and mint syrup.'],
            ],
            'food' => [
                ['Kimbab Ayam Jepret', 23000, 'Dengan isian ayam geprek.'],
                ['Nasi Kulit Ayam Jepret', 23000, 'Sambal Bawang, Korean Spicy, Barbeque, Mayonnaise.'],
                ['Nasi Ayam Jepret', 23000, 'Sambal Bawang, Korean Spicy, Barbeque, Mayonnaise.'],
                ['Indomie Ayam Jepret', 23000, 'Sambal Bawang, Korean Spicy, Barbeque, Mayonnaise.'],
                ['Spaghetti Carbonara', 19000, 'Saus carbonara creamy dan taburan keju.'],
                ['Spaghetti Bolognese', 19000, 'Saus bolognese gurih manis dan taburan keju.'],
                ['Spaghetti Aglio Olio', 19000, 'Saus bolognese gurih manis dan taburan keju.'],
            ],
            'snack' => [
                ['French Fries', 19000, 'Kentang goreng renyah.'],
                ['Nugget', 20000, 'Nugget ayam.'],
                ['Siomay Ayam', 25000, 'Siomay ayam.'],
                ['Kulit Crispy', 20000, 'Kulit ayam crispy.'],
                ['Mix Platter', 35000, 'Aneka camilan dalam satu piring.'],
                ['Dimsum Mentai', 20000, 'Dimsum dengan saus mentai.'],
                ['Sandwich', 19000, 'Sandwich isi ayam dan sayur.'],
                ['Roti Goreng Telur', 19000, 'Roti goreng dengan telur.'],
            ],
        ];

        $drinkCategories = ['coffee', 'tea-series', 'signature', 'milk-base', 'choco-series'];
        $products = [];

        foreach ($menu as $categorySlug => $items) {
            foreach ($items as $index => [$name, $price, $description]) {
                $slug = Str::slug($name);

                /** @var Product $product */
                $product = Product::withTrashed()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'category_id' => $categoryModels[$categorySlug]->id,
                        'name' => $name,
                        'description' => $description,
                        'base_price' => $price,
                        'is_sold_out' => false,
                        'is_active' => true,
                        'badge' => null,
                        'sort_order' => $index + 1,
                    ],
                );

                if ($product->trashed()) {
                    $product->restore();
                }

                // Menu asli tidak memakai varian ukuran/suhu.
                $product->variants()->delete();

                $products[$slug] = ['product' => $product, 'category' => $categorySlug];
            }
        }

        // Menu demo lama tidak ditampilkan lagi.
        Product::query()
            ->whereNotIn('slug', array_keys($products))
            ->delete();

        $extraGroup = AddonGroup::updateOrCreate(
            ['name' => 'Extra'],
            [
                'selection_type' => 'multiple',
                'min_select' => 0,
                'max_select' => 5,
                'is_active' => true,
            ],
        );

        AddonGroup::query()
            ->whereKeyNot($extraGroup->id)
            ->update(['is_active' => false]);

        $extras = [
            ['Extra Shot', 4000],
            ['Cream Cheese', 3000],
            ['Oreo', 3000],
            ['Oatmilk', 6000],
            ['Air Es', 2000],
        ];

        foreach ($extras as $index => [$name, $price]) {
            Addon::updateOrCreate(
                ['addon_group_id' => $extraGroup->id, 'name' => $name],
                [
                    'price_delta' => $price,
                    'is_sold_out' => false,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ],
            );
        }

        Addon::query()
            ->where('addon_group_id', $extraGroup->id)
            ->whereNotIn('name', array_column($extras, 0))
            ->update(['is_active' => false]);

        foreach ($products as ['product' => $product, 'category' => $categorySlug]) {
            $product->addonGroups()->sync(
                in_array($categorySlug, $drinkCategories, true) ? [$extraGroup->id] : []
            );
        }

        // Keranjang lama berisi produk demo; kosongkan agar tidak jadi item tak tersedia.
        CartItem::query()->delete();
        Cart::query()->delete();
    }
}
