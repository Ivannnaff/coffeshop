<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VariantType;
use Database\Factories\ProductVariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $product_id
 * @property VariantType $type
 * @property string $name
 * @property int $price_delta
 * @property bool $is_default
 * @property int $sort_order
 * @property-read Product|null $product
 */
class ProductVariant extends Model
{
    /** @use HasFactory<ProductVariantFactory> */
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type',
        'name',
        'price_delta',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'type' => VariantType::class,
            'price_delta' => 'integer',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
