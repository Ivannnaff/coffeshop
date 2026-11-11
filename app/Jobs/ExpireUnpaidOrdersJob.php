<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Order\Exceptions\InvalidOrderTransitionException;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExpireUnpaidOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(OrderStatusService $orderStatusService): void
    {
        Order::query()
            ->where('status', OrderStatus::PendingPayment->value)
            ->where('expires_at', '<=', now())
            ->chunkById(100, function ($orders) use ($orderStatusService) {
                foreach ($orders as $order) {
                    try {
                        $orderStatusService->transition(
                            $order,
                            OrderStatus::Expired,
                            StatusActorType::System,
                            null,
                            'Kadaluwarsa otomatis oleh sistem.'
                        );
                    } catch (InvalidOrderTransitionException) {
                        // Abaikan jika sudah berubah status
                    }
                }
            });
    }
}
