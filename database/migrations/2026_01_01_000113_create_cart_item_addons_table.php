<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_item_addons', function (Blueprint $table) {
            $table->foreignId('cart_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('addon_id')->constrained()->cascadeOnDelete();

            $table->primary(['cart_item_id', 'addon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_item_addons');
    }
};
