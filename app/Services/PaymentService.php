<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Domain\Payment\Exceptions\PaymentGatewayException;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StatusActorType;
use App\Enums\WebhookResult;
use App\Models\Order;
use App\Models\Payment;
use App\Models\WebhookEvent;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Membuat transaksi di gateway dan memproses webhook pembayaran.
 * Webhook diproses dalam transaksi dengan lockForUpdate() pada orders
 * (06-SECURITY.md bagian 3).
 */
class PaymentService
{
    public function __construct(
        protected PaymentGateway $gateway,
        protected OrderStatusService $orderStatusService,
        protected StoreSettingsService $storeSettings,
    ) {}

    public function initiatePayment(Order $order): Payment
    {
        /** @var Payment $payment */
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => $this->gateway->name()->value,
            'gateway_transaction_id' => null,
            'payment_method' => null,
            'amount' => $order->total,
            'status' => PaymentStatus::Pending->value,
            'signature_valid' => false,
        ]);

        try {
            $initiation = $this->gateway->createTransaction(
                $order,
                $this->storeSettings->paymentExpiryMinutes(),
            );
        } catch (Throwable $exception) {
            $payment->update(['status' => PaymentStatus::Failed->value]);

            throw $exception instanceof PaymentGatewayException
                ? $exception
                : PaymentGatewayException::because($exception->getMessage());
        }

        $payment->update([
            'gateway_transaction_id' => $initiation->transactionId,
            'raw_payload' => $initiation->rawResponse,
            'received_at' => now(),
        ]);

        return $payment->fresh();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function processWebhook(array $payload): WebhookResult
    {
        $gatewayName = $this->gateway->name();

        // Verifikasi signature sebelum membaca isi payload (06-SECURITY.md bagian 3).
        $signatureValid = $this->gateway->verifySignature($payload);
        $notification = $this->gateway->parseNotification($payload);

        $statusValue = $notification->status->value;
        $eventId = $notification->transactionId !== ''
            ? $notification->transactionId.':'.$statusValue
            : hash('sha256', json_encode($payload) ?: '');

        if (! $signatureValid) {
            Log::channel('security')->warning('Webhook pembayaran dengan signature tidak valid.', [
                'gateway' => $gatewayName->value,
                'event_id' => $eventId,
                'ip' => request()->ip(),
            ]);

            // Event invalid diberi prefix agar tidak menimpa idempotensi transaksi asli.
            /** @var WebhookEvent $invalidEvent */
            $invalidEvent = WebhookEvent::firstOrCreate(
                [
                    'gateway' => $gatewayName->value,
                    'event_id' => 'invalid-'.$eventId,
                ],
                [
                    'payload' => $payload,
                    'received_at' => now(),
                ],
            );
            $this->finishEvent($invalidEvent, WebhookResult::Rejected);

            return WebhookResult::Rejected;
        }

        try {
            /** @var WebhookEvent $event */
            $event = WebhookEvent::create([
                'gateway' => $gatewayName->value,
                'event_id' => $eventId,
                'payload' => $payload,
                'received_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            // Dua webhook bersamaan: hanya satu yang boleh memproses.
            return WebhookResult::Duplicate;
        }

        if ($notification->orderNumber === '' || $notification->transactionId === '') {
            $this->finishEvent($event, WebhookResult::Rejected);

            return WebhookResult::Rejected;
        }

        /** @var Order|null $order */
        $order = Order::query()
            ->where('order_number', $notification->orderNumber)
            ->first();

        if ($order === null || $notification->amount !== $order->total) {
            Log::channel('payment')->warning('Webhook pembayaran ditolak: pesanan tidak ditemukan atau nominal tidak cocok.', [
                'gateway' => $gatewayName->value,
                'order_number' => $notification->orderNumber,
                'amount' => $notification->amount,
                'event_id' => $eventId,
            ]);

            $this->finishEvent($event, WebhookResult::Rejected);

            return WebhookResult::Rejected;
        }

        return DB::transaction(function () use ($order, $notification, $event, $gatewayName): WebhookResult {
            /** @var Order $lockedOrder */
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            $payment = Payment::query()
                ->where('gateway', $gatewayName->value)
                ->where('gateway_transaction_id', $notification->transactionId)
                ->first();

            if ($payment === null) {
                $payment = Payment::query()
                    ->where('order_id', $lockedOrder->id)
                    ->where('gateway', $gatewayName->value)
                    ->whereNull('gateway_transaction_id')
                    ->latest('id')
                    ->first();
            }

            if ($payment === null) {
                $payment = new Payment([
                    'order_id' => $lockedOrder->id,
                    'gateway' => $gatewayName->value,
                ]);
            }

            $payment->fill([
                'gateway_transaction_id' => $notification->transactionId,
                'payment_method' => $notification->paymentMethod,
                'amount' => $notification->amount,
                'status' => $notification->status->value,
                'raw_payload' => $notification->rawPayload,
                'signature_valid' => true,
                'received_at' => now(),
                'processed_at' => now(),
            ])->save();

            if ($notification->status !== PaymentStatus::Settled) {
                $this->finishEvent($event, WebhookResult::Processed);

                return WebhookResult::Processed;
            }

            if ($lockedOrder->status === OrderStatus::Expired) {
                Log::channel('payment')->warning('Pembayaran masuk setelah pesanan EXPIRED (late_after_expired). Perlu refund manual.', [
                    'gateway' => $gatewayName->value,
                    'order_number' => $lockedOrder->order_number,
                    'transaction_id' => $notification->transactionId,
                    'amount' => $notification->amount,
                ]);

                $this->finishEvent($event, WebhookResult::LateAfterExpired);

                return WebhookResult::LateAfterExpired;
            }

            if ($lockedOrder->status !== OrderStatus::PendingPayment) {
                $this->finishEvent($event, WebhookResult::Duplicate);

                return WebhookResult::Duplicate;
            }

            $this->orderStatusService->transition(
                $lockedOrder,
                OrderStatus::Paid,
                StatusActorType::Webhook,
                null,
                'Pembayaran berhasil via webhook gateway.',
            );

            Log::channel('payment')->info('Pembayaran settled.', [
                'gateway' => $gatewayName->value,
                'order_number' => $lockedOrder->order_number,
                'transaction_id' => $notification->transactionId,
                'amount' => $notification->amount,
            ]);

            $this->finishEvent($event, WebhookResult::Processed);

            return WebhookResult::Processed;
        });
    }

    private function finishEvent(WebhookEvent $event, WebhookResult $result): void
    {
        $event->update([
            'processed_at' => now(),
            'result' => $result->value,
        ]);
    }
}
