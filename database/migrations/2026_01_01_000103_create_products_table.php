<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->bigInteger('base_price');
            $table->string('image_path')->nullable();
            $table->boolean('is_sold_out')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('badge')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
            $table->index(['is_active', 'is_sold_out']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
