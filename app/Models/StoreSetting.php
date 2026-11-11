<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $store_id
 * @property string $name
 * @property string|null $address
 * @property float|null $latitude
 * @property float|null $longitude
 * @property string|null $opening_time
 * @property string|null $closing_time
 * @property string $timezone
 * @property bool $is_accepting_orders
 * @property int $payment_expiry_minutes
 * @property int $delivery_min_item_price
 */
class StoreSetting extends Model
{
    protected $fillable = [
        'store_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'opening_time',
        'closing_time',
        'timezone',
        'is_accepting_orders',
        'payment_expiry_minutes',
        'delivery_min_item_price',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_accepting_orders' => 'boolean',
            'payment_expiry_minutes' => 'integer',
            'delivery_min_item_price' => 'integer',
        ];
    }
}
