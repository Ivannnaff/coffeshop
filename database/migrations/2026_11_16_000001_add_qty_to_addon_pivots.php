<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_item_addons', function (Blueprint $table) {
            $table->unsignedInteger('qty')->default(1)->after('addon_id');
        });

        Schema::table('order_item_addons', function (Blueprint $table) {
            $table->unsignedInteger('qty')->default(1)->after('price_delta');
        });

        // Add-on lama berlaku untuk seluruh baris, jadi qty-nya mengikuti qty baris.
        DB::table('cart_item_addons')->update([
            'qty' => DB::raw('(select qty from cart_items where cart_items.id = cart_item_addons.cart_item_id)'),
        ]);

        DB::table('order_item_addons')->update([
            'qty' => DB::raw('(select qty from order_items where order_items.id = order_item_addons.order_item_id)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('cart_item_addons', function (Blueprint $table) {
            $table->dropColumn('qty');
        });

        Schema::table('order_item_addons', function (Blueprint $table) {
            $table->dropColumn('qty');
        });
    }
};
