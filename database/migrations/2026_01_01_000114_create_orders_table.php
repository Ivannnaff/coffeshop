<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('store_id')->default(1);
            $table->string('order_number', 32)->unique();
            $table->string('public_token', 64)->unique();
            $table->string('mode');
            $table->string('status')->default('PENDING_PAYMENT');

            $table->foreignId('table_id')->nullable()->constrained()->nullOnDelete();
            $table->string('table_number')->nullable();

            $table->string('customer_name');
            $table->string('customer_phone', 32);

            $table->text('delivery_address')->nullable();
            $table->decimal('delivery_latitude', 10, 7)->nullable();
            $table->decimal('delivery_longitude', 10, 7)->nullable();
            $table->decimal('delivery_distance_km', 6, 2)->nullable();
            $table->foreignId('delivery_zone_id')->nullable()->constrained()->nullOnDelete();
            $table->string('delivery_zone_name')->nullable();

            $table->bigInteger('subtotal');
            $table->bigInteger('eligible_subtotal')->default(0);
            $table->bigInteger('delivery_fee')->default(0);
            $table->bigInteger('delivery_discount')->default(0);
            $table->bigInteger('total');
            $table->bigInteger('min_item_price_snapshot');

            $table->string('pickup_note')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['status', 'expires_at']);
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
