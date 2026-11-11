<?php

declare(strict_types=1);

namespace App\Http\Controllers\Kds;

use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Http\Controllers\Controller;
use App\Http\Requests\KdsTransitionRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class KdsOrderController extends Controller
{
    public function __construct(
        protected OrderStatusService $orderStatusService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Order::class);

        $statusParam = $request->string('status')->toString();

        if ($statusParam !== '') {
            $requested = array_values(array_filter(explode(',', $statusParam)));
            $allowed = [
                OrderStatus::Paid->value,
                OrderStatus::Preparing->value,
                OrderStatus::Ready->value,
                OrderStatus::OutForDelivery->value,
            ];

            $statuses = array_values(array_intersect($requested, $allowed));

            if ($statuses === []) {
                $statuses = [OrderStatus::Paid->value, OrderStatus::Preparing->value];
            }
        } else {
            $statuses = [
                OrderStatus::Paid->value,
                OrderStatus::Preparing->value,
                OrderStatus::Ready->value,
                OrderStatus::OutForDelivery->value,
            ];
        }

        $orders = Order::query()
            ->whereIn('status', $statuses)
            ->with(['items.addons', 'statusLogs', 'table', 'deliveryZone', 'payments'])
            ->orderByRaw('CASE WHEN paid_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('paid_at')
            ->orderBy('created_at')
            ->get();

        return OrderResource::collection($orders);
    }

    public function start(KdsTransitionRequest $request, Order $order): OrderResource|JsonResponse
    {
        return $this->transition($request, $order, OrderStatus::Preparing);
    }

    public function ready(KdsTransitionRequest $request, Order $order): OrderResource|JsonResponse
    {
        return $this->transition($request, $order, OrderStatus::Ready);
    }

    public function complete(KdsTransitionRequest $request, Order $order): OrderResource|JsonResponse
    {
        return $this->transition($request, $order, OrderStatus::Completed);
    }

    public function dispatch(KdsTransitionRequest $request, Order $order): OrderResource|JsonResponse
    {
        return $this->transition($request, $order, OrderStatus::OutForDelivery);
    }

    public function deliver(KdsTransitionRequest $request, Order $order): OrderResource|JsonResponse
    {
        return $this->transition($request, $order, OrderStatus::Completed);
    }

    private function transition(
        KdsTransitionRequest $request,
        Order $order,
        OrderStatus $target
    ): OrderResource|JsonResponse {
        Gate::authorize('transition', $order);

        $version = $request->integer('version');

        // Optimistic concurrency: tolak jika klien memakai versi order yang sudah usang.
        if ($version !== 0 && $order->updated_at?->getTimestampMs() !== $version) {
            return response()->json([
                'message' => 'Pesanan sudah diubah oleh pengguna lain. Muat ulang antrean.',
                'code' => 'STALE_ORDER',
                'version' => $order->updated_at?->getTimestampMs(),
            ], 409);
        }

        $note = $request->filled('note') ? (string) $request->string('note') : null;

        $updated = $this->orderStatusService->transition(
            $order,
            $target,
            StatusActorType::User,
            (int) $request->user()?->id,
            $note,
        );

        return new OrderResource(
            $updated->load(['items.addons', 'statusLogs', 'table', 'deliveryZone', 'payments'])
        );
    }
}
