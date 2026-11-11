<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductBadge;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property int $base_price
 * @property string|null $image_path
 * @property bool $is_sold_out
 * @property bool $is_active
 * @property ProductBadge|null $badge
 * @property int $sort_order
 * @property-read Category|null $category
 * @property-read Collection<int, ProductVariant> $variants
 * @property-read Collection<int, AddonGroup> $addonGroups
 */
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'base_price',
        'image_path',
        'is_sold_out',
        'is_active',
        'badge',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'integer',
            'is_sold_out' => 'boolean',
            'is_active' => 'boolean',
            'badge' => ProductBadge::class,
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * @return BelongsToMany<AddonGroup, $this>
     */
    public function addonGroups(): BelongsToMany
    {
        return $this->belongsToMany(
            AddonGroup::class,
            'product_addon_group',
            'product_id',
            'addon_group_id'
        )->withPivot('sort_order')->orderByPivot('sort_order');
    }
}
