<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $store_id
 * @property string $order_number
 * @property string $public_token
 * @property OrderMode $mode
 * @property OrderStatus $status
 * @property int|null $table_id
 * @property string|null $table_number
 * @property string $customer_name
 * @property string $customer_phone
 * @property string|null $delivery_address
 * @property float|null $delivery_latitude
 * @property float|null $delivery_longitude
 * @property float|null $delivery_distance_km
 * @property int|null $delivery_zone_id
 * @property string|null $delivery_zone_name
 * @property int $subtotal
 * @property int $eligible_subtotal
 * @property int $delivery_fee
 * @property int $delivery_discount
 * @property int $total
 * @property int $min_item_price_snapshot
 * @property string|null $pickup_note
 * @property Carbon|null $expires_at
 * @property Carbon|null $paid_at
 * @property Carbon|null $completed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Table|null $table
 * @property-read DeliveryZone|null $deliveryZone
 * @property-read Collection<int, OrderItem> $items
 * @property-read Collection<int, OrderStatusLog> $statusLogs
 * @property-read Collection<int, Payment> $payments
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'store_id',
        'order_number',
        'public_token',
        'mode',
        'status',
        'table_id',
        'table_number',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_distance_km',
        'delivery_zone_id',
        'delivery_zone_name',
        'subtotal',
        'eligible_subtotal',
        'delivery_fee',
        'delivery_discount',
        'total',
        'min_item_price_snapshot',
        'pickup_note',
        'expires_at',
        'paid_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'mode' => OrderMode::class,
            'status' => OrderStatus::class,
            'delivery_latitude' => 'float',
            'delivery_longitude' => 'float',
            'delivery_distance_km' => 'float',
            'subtotal' => 'integer',
            'eligible_subtotal' => 'integer',
            'delivery_fee' => 'integer',
            'delivery_discount' => 'integer',
            'total' => 'integer',
            'min_item_price_snapshot' => 'integer',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Table, $this>
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    /**
     * @return BelongsTo<DeliveryZone, $this>
     */
    public function deliveryZone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
