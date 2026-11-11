<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('store_id')->default(1)->unique();
            $table->string('name');
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->string('timezone')->default('Asia/Jakarta');
            $table->boolean('is_accepting_orders')->default(true);
            $table->unsignedSmallInteger('payment_expiry_minutes')->default(15);
            $table->unsignedBigInteger('delivery_min_item_price')->default(15000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
