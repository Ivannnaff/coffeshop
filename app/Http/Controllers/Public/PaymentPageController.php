<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicOrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentPageController extends Controller
{
    public function __invoke(Request $request, string $token): Response
    {
        /** @var Order $order */
        $order = Order::query()
            ->where('public_token', $token)
            ->with(['payments', 'items.addons', 'table', 'deliveryZone'])
            ->firstOrFail();

        return Inertia::render('Payment/Index', [
            'order' => (new PublicOrderResource($order))->resolve($request),
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
