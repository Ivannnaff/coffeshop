<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AddonSelectionType;
use Database\Factories\AddonGroupFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property AddonSelectionType $selection_type
 * @property int $min_select
 * @property int $max_select
 * @property bool $is_active
 * @property-read Collection<int, Addon> $addons
 * @property-read Collection<int, Product> $products
 */
class AddonGroup extends Model
{
    /** @use HasFactory<AddonGroupFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'selection_type',
        'min_select',
        'max_select',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'selection_type' => AddonSelectionType::class,
            'min_select' => 'integer',
            'max_select' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Addon, $this>
     */
    public function addons(): HasMany
    {
        return $this->hasMany(Addon::class);
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
            'product_addon_group',
            'addon_group_id',
            'product_id'
        )->withPivot('sort_order');
    }
}
