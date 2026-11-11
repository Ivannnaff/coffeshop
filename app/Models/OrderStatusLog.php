<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StatusActorType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Log append-only: hanya insert, tidak pernah update atau delete.
 * Lihat 03-DATABASE.md bagian 2.6.
 *
 * @property int $id
 * @property int $order_id
 * @property string|null $from_status
 * @property string $to_status
 * @property StatusActorType $actor_type
 * @property int|null $actor_id
 * @property string|null $note
 * @property Carbon $created_at
 * @property-read Order|null $order
 * @property-read User|null $actor
 */
class OrderStatusLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'order_id',
        'from_status',
        'to_status',
        'actor_type',
        'actor_id',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'actor_type' => StatusActorType::class,
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
