<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Order\OrderStateMachine;
use App\Enums\OrderStatus;
use App\Enums\StatusActorType;
use App\Events\OrderPaid;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\OrderStatusLog;
use Illuminate\Support\Facades\DB;

class OrderStatusService
{
    public function __construct(
        protected OrderStateMachine $stateMachine,
        protected ReportService $reportService,
    ) {}

    /**
     * Mengubah status pesanan dan mencatat log append-only dalam transaksi.
     */
    public function transition(
        Order $order,
        OrderStatus $targetStatus,
        StatusActorType $actorType,
        ?int $actorId = null,
        ?string $note = null
    ): Order {
        return DB::transaction(function () use ($order, $targetStatus, $actorType, $actorId, $note) {
            // Lock row order untuk mencegah race condition (lihat 06-SECURITY.md / 07-CODING-RULES.md)
            /** @var Order $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            $currentStatus = $lockedOrder->status;

            // Validasi transisi via State Machine
            $this->stateMachine->assertCanTransition(
                $currentStatus,
                $targetStatus,
                $lockedOrder->mode,
                $actorType
            );

            if ($currentStatus === $targetStatus) {
                return $lockedOrder;
            }

            $updateData = [
                'status' => $targetStatus,
            ];

            if ($targetStatus === OrderStatus::Paid && ! $lockedOrder->paid_at) {
                $updateData['paid_at'] = now();
            }

            if ($targetStatus === OrderStatus::Completed && ! $lockedOrder->completed_at) {
                $updateData['completed_at'] = now();
            }

            $lockedOrder->update($updateData);

            // Catat ke order_status_logs (append-only)
            OrderStatusLog::create([
                'order_id' => $lockedOrder->id,
                'from_status' => $currentStatus->value,
                'to_status' => $targetStatus->value,
                'actor_type' => $actorType->value,
                'actor_id' => $actorId,
                'note' => $note,
                'created_at' => now(),
            ]);

            // Invalidasi cache laporan (Fase 7): status penjualan berubah.
            if (
                in_array($targetStatus, OrderStatus::countedAsSales(), true)
                || in_array($currentStatus, OrderStatus::countedAsSales(), true)
            ) {
                $this->reportService->invalidate();
            }

            /** @var Order $updatedOrder */
            $updatedOrder = $lockedOrder->fresh(['statusLogs']) ?? $lockedOrder;

            // Event real-time (Fase 8). Implementasi ShouldDispatchAfterCommit
            // memastikan event baru dikirim setelah transaksi commit.
            if ($targetStatus === OrderStatus::Paid) {
                OrderPaid::dispatch($updatedOrder);
            }

            OrderStatusChanged::dispatch($updatedOrder, $currentStatus, $targetStatus);

            return $updatedOrder;
        });
    }
}
