<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderMode;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $token
 * @property OrderMode $mode
 * @property int|null $table_id
 * @property Carbon $last_activity_at
 * @property Carbon|null $expires_at
 * @property-read Table|null $table
 * @property-read Collection<int, CartItem> $items
 */
class Cart extends Model
{
    protected $fillable = [
        'token',
        'mode',
        'table_id',
        'last_activity_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'mode' => OrderMode::class,
            'last_activity_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Table, $this>
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
