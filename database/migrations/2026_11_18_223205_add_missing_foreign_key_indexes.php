<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->index('cart_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('order_id');
        });

        Schema::table('cart_item_addons', function (Blueprint $table) {
            $table->index('cart_item_id');
        });

        Schema::table('order_item_addons', function (Blueprint $table) {
            $table->index('order_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex(['cart_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
        });

        Schema::table('cart_item_addons', function (Blueprint $table) {
            $table->dropIndex(['cart_item_id']);
        });

        Schema::table('order_item_addons', function (Blueprint $table) {
            $table->dropIndex(['order_item_id']);
        });
    }
};
