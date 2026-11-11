<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Contracts\PaymentGateway;
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
use Illuminate\Support\Facades\Log;
use Throwable;

class ExpireUnpaidOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(OrderStatusService $orderStatusService, PaymentGateway $gateway): void
    {
        Order::query()
            ->where('status', OrderStatus::PendingPayment->value)
            ->where('expires_at', '<=', now())
            ->with('payments')
            ->chunkById(100, function ($orders) use ($orderStatusService, $gateway) {
                foreach ($orders as $order) {
                    // Sinkronkan status gateway lebih dulu agar transaksi tidak
                    // tetap terbuka di Midtrans setelah pesanan kedaluwarsa (B-09).
                    if ($order->payments->isNotEmpty()) {
                        try {
                            $gateway->expireTransaction($order);
                        } catch (Throwable $exception) {
                            Log::channel('payment')->warning('Gagal menutup transaksi gateway saat expiry.', [
                                'order_number' => $order->order_number,
                                'error' => $exception->getMessage(),
                            ]);
                        }
                    }

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
