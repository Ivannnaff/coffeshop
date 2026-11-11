<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DeliveryDiscountType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $delivery_zone_id
 * @property int $min_eligible_subtotal
 * @property DeliveryDiscountType $discount_type
 * @property int|null $discount_value
 * @property bool $is_active
 * @property-read DeliveryZone|null $deliveryZone
 */
class DeliveryFeeRule extends Model
{
    protected $fillable = [
        'delivery_zone_id',
        'min_eligible_subtotal',
        'discount_type',
        'discount_value',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_eligible_subtotal' => 'integer',
            'discount_type' => DeliveryDiscountType::class,
            'discount_value' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<DeliveryZone, $this>
     */
    public function deliveryZone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class);
    }
}
