<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property PaymentGateway $gateway
 * @property string|null $gateway_transaction_id
 * @property string|null $payment_method
 * @property int $amount
 * @property PaymentStatus $status
 * @property array<string, mixed>|null $raw_payload
 * @property bool $signature_valid
 * @property Carbon|null $received_at
 * @property Carbon|null $processed_at
 * @property-read Order|null $order
 */
class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'gateway',
        'gateway_transaction_id',
        'payment_method',
        'amount',
        'status',
        'raw_payload',
        'signature_valid',
        'received_at',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'gateway' => PaymentGateway::class,
            'status' => PaymentStatus::class,
            'amount' => 'integer',
            'raw_payload' => 'array',
            'signature_valid' => 'boolean',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
