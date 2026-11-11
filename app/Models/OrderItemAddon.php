<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $order_item_id
 * @property int|null $addon_id
 * @property string $addon_name
 * @property int $price_delta
 * @property-read OrderItem|null $orderItem
 * @property-read Addon|null $addon
 */
class OrderItemAddon extends Model
{
    protected $fillable = [
        'order_item_id',
        'addon_id',
        'addon_name',
        'price_delta',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<OrderItem, $this>
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * @return BelongsTo<Addon, $this>
     */
    public function addon(): BelongsTo
    {
        return $this->belongsTo(Addon::class);
    }
}
