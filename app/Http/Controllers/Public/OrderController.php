<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;

class OrderController extends Controller
{
    public function show(string $publicToken): OrderResource
    {
        /** @var Order $order */
        $order = Order::query()
            ->where('public_token', $publicToken)
            ->with(['items.addons', 'statusLogs', 'table', 'deliveryZone', 'payments'])
            ->firstOrFail();

        return new OrderResource($order);
    }
}
