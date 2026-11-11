<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\AddonFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $addon_group_id
 * @property string $name
 * @property int $price_delta
 * @property bool $is_sold_out
 * @property bool $is_active
 * @property int $sort_order
 * @property-read AddonGroup|null $addonGroup
 */
class Addon extends Model
{
    /** @use HasFactory<AddonFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'addon_group_id',
        'name',
        'price_delta',
        'is_sold_out',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'integer',
            'is_sold_out' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<AddonGroup, $this>
     */
    public function addonGroup(): BelongsTo
    {
        return $this->belongsTo(AddonGroup::class);
    }
}
