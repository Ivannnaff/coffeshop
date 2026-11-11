<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array{from: string, to: string, total_revenue: int, total_orders: int, total_items_sold: int, top_products: array<int, array{name: string, qty: int}>} $data */
        $data = $this->resource;

        return [
            'from' => $data['from'],
            'to' => $data['to'],
            'total_revenue' => $data['total_revenue'],
            'total_orders' => $data['total_orders'],
            'total_items_sold' => $data['total_items_sold'],
            'top_products' => $data['top_products'],
        ];
    }
}
