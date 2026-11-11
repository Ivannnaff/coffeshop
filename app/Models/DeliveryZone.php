<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\DeliveryZoneFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $store_id
 * @property string $name
 * @property float $max_distance_km
 * @property int $base_fee
 * @property int|null $free_fee_min_subtotal
 * @property int $sort_order
 * @property bool $is_active
 * @property-read Collection<int, DeliveryFeeRule> $feeRules
 */
class DeliveryZone extends Model
{
    /** @use HasFactory<DeliveryZoneFactory> */
    use HasFactory;

    protected $fillable = [
        'store_id',
        'name',
        'max_distance_km',
        'base_fee',
        'free_fee_min_subtotal',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'max_distance_km' => 'float',
            'base_fee' => 'integer',
            'free_fee_min_subtotal' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<DeliveryFeeRule, $this>
     */
    public function feeRules(): HasMany
    {
        return $this->hasMany(DeliveryFeeRule::class);
    }
}
