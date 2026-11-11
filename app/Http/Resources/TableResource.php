<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Table
 */
class TableResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Table $table */
        $table = $this->resource;

        return [
            'id' => $table->id,
            'store_id' => $table->store_id,
            'number' => $table->number,
            'qr_token' => $table->qr_token,
            'is_active' => $table->is_active,
        ];
    }
}
