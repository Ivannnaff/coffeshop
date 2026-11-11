<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $order_id
 * @property int|null $product_id
 * @property string $product_name
 * @property string|null $size_name
 * @property string|null $temperature_name
 * @property int $base_price
 * @property int $variant_delta
 * @property int $addons_total
 * @property int $discount_amount
 * @property int $unit_price
 * @property int $qty
 * @property int $line_total
 * @property bool $is_delivery_eligible
 * @property string|null $note
 * @property-read Order|null $order
 * @property-read Product|null $product
 * @property-read Collection<int, OrderItemAddon> $addons
 */
class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'size_name',
        'temperature_name',
        'base_price',
        'variant_delta',
        'addons_total',
        'discount_amount',
        'unit_price',
        'qty',
        'line_total',
        'is_delivery_eligible',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'integer',
            'variant_delta' => 'integer',
            'addons_total' => 'integer',
            'discount_amount' => 'integer',
            'unit_price' => 'integer',
            'qty' => 'integer',
            'line_total' => 'integer',
            'is_delivery_eligible' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<OrderItemAddon, $this>
     */
    public function addons(): HasMany
    {
        return $this->hasMany(OrderItemAddon::class);
    }
}
