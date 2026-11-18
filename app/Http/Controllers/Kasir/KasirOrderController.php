<?php

declare(strict_types=1);

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Http\Requests\CashierOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\CashierOrderService;
use Illuminate\Http\JsonResponse;

class KasirOrderController extends Controller
{
    public function store(CashierOrderRequest $request, CashierOrderService $service): JsonResponse
    {
        $order = $service->create(
            $request->validated(),
            (int) $request->user()?->id,
        );

        return (new OrderResource(
            $order->load(['items.addons', 'statusLogs', 'table', 'payments'])
        ))->response()->setStatusCode(201);
    }
}
