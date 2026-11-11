<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->string('gateway');
            $table->string('gateway_transaction_id');
            $table->string('payment_method')->nullable();
            $table->bigInteger('amount');
            $table->string('status')->default('pending');
            $table->jsonb('raw_payload')->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            // Idempotensi webhook: kombinasi gateway dan ID transaksi tidak boleh ganda.
            $table->unique(['gateway', 'gateway_transaction_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
