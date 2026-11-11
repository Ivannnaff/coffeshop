<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();

            $table->string('product_name');
            $table->string('size_name')->nullable();
            $table->string('temperature_name')->nullable();

            $table->bigInteger('base_price');
            $table->bigInteger('variant_delta')->default(0);
            $table->bigInteger('addons_total')->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('unit_price');
            $table->unsignedInteger('qty');
            $table->bigInteger('line_total');
            $table->boolean('is_delivery_eligible')->default(false);
            $table->string('note', 140)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
