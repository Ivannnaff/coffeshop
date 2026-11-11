<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentGateway;
use App\Enums\WebhookResult;
use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = [
        'gateway',
        'event_id',
        'payload',
        'received_at',
        'processed_at',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'gateway' => PaymentGateway::class,
            'payload' => 'array',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
            'result' => WebhookResult::class,
        ];
    }
}
