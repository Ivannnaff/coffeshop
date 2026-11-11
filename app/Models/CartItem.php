<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $cart_id
 * @property int $product_id
 * @property list<int> $product_variant_ids
 * @property int $qty
 * @property string|null $note
 * @property-read Cart|null $cart
 * @property-read Product|null $product
 * @property-read Collection<int, Addon> $addons
 */
class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'product_variant_ids',
        'qty',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'product_variant_ids' => 'array',
            'qty' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Cart, $this>
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsToMany<Addon, $this>
     */
    public function addons(): BelongsToMany
    {
        return $this->belongsToMany(Addon::class, 'cart_item_addons');
    }
}
