<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\TableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $store_id
 * @property string $number
 * @property string $qr_token
 * @property bool $is_active
 */
class Table extends Model
{
    /** @use HasFactory<TableFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'store_id',
        'number',
        'qr_token',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
