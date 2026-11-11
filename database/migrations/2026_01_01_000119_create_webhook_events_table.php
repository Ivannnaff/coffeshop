<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('gateway');
            $table->string('event_id');
            $table->jsonb('payload')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->string('result')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'event_id']);
            $table->index('result');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
