<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\Domain\Payment\DTO\PaymentInitiation;
use App\Domain\Payment\DTO\PaymentNotification;
use App\Domain\Payment\Exceptions\PaymentGatewayException;
use App\Enums\PaymentGateway as PaymentGatewayEnum;
use App\Enums\PaymentStatus;
use App\Models\Order;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Adapter Midtrans Snap. Signature webhook mengikuti 06-SECURITY.md bagian 3:
 * SHA512(order_id + status_code + gross_amount + ServerKey).
 */
class MidtransGateway implements PaymentGateway
{
    public function name(): PaymentGatewayEnum
    {
        return PaymentGatewayEnum::Midtrans;
    }

    public function createTransaction(Order $order, int $expiryMinutes): PaymentInitiation
    {
        $serverKey = $this->serverKey();

        if ($serverKey === '') {
            throw PaymentGatewayException::because('MIDTRANS_SERVER_KEY belum diisi.');
        }

        $payload = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => $order->total,
            ],
            'expiry' => [
                'unit' => 'minutes',
                'duration' => $expiryMinutes,
            ],
            'customer_details' => [
                'first_name' => $order->customer_name,
                'phone' => $order->customer_phone,
            ],
        ];

        $finishUrl = (string) config('menanti.payment.finish_url', '');
        if ($finishUrl !== '') {
            $payload['callbacks'] = ['finish' => $finishUrl];
        }

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->acceptJson()
                ->asJson()
                ->timeout(15)
                ->post($this->snapUrl(), $payload);
        } catch (ConnectionException $exception) {
            throw PaymentGatewayException::because($exception->getMessage());
        }

        if ($response->failed()) {
            throw PaymentGatewayException::because(
                (string) ($response->json('status_message') ?? $response->body())
            );
        }

        $body = $response->json();
        $redirectUrl = is_array($body) ? (string) ($body['redirect_url'] ?? '') : '';

        if ($redirectUrl === '') {
            throw PaymentGatewayException::because('Respons Midtrans tidak berisi redirect_url.');
        }

        return new PaymentInitiation(
            transactionId: null,
            redirectUrl: $redirectUrl,
            token: is_array($body) && isset($body['token']) ? (string) $body['token'] : null,
            rawResponse: is_array($body) ? $body : [],
        );
    }

    public function expireTransaction(Order $order): void
    {
        $serverKey = $this->serverKey();

        if ($serverKey === '') {
            throw PaymentGatewayException::because('MIDTRANS_SERVER_KEY belum diisi.');
        }

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->acceptJson()
                ->timeout(15)
                ->post($this->apiUrl().'/v2/'.$order->order_number.'/expire');
        } catch (ConnectionException $exception) {
            throw PaymentGatewayException::because($exception->getMessage());
        }

        // 404 berarti transaksi belum pernah dibuat di gateway, tidak perlu dianggap gagal.
        if ($response->failed() && $response->status() !== 404) {
            throw PaymentGatewayException::because(
                (string) ($response->json('status_message') ?? $response->body())
            );
        }
    }

    public function verifySignature(array $payload): bool
    {
        $serverKey = $this->serverKey();
        if ($serverKey === '') {
            return false;
        }

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        if ($orderId === '' || $statusCode === '' || $grossAmount === '' || $signature === '') {
            return false;
        }

        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        return hash_equals($expected, $signature);
    }

    public function parseNotification(array $payload): PaymentNotification
    {
        $transactionStatus = (string) ($payload['transaction_status'] ?? '');
        $fraudStatus = (string) ($payload['fraud_status'] ?? 'accept');

        $status = match (true) {
            $transactionStatus === 'settlement' => PaymentStatus::Settled,
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => PaymentStatus::Settled,
            $transactionStatus === 'expire' => PaymentStatus::Expired,
            $transactionStatus === 'deny',
            $transactionStatus === 'cancel',
            $transactionStatus === 'failure' => PaymentStatus::Failed,
            default => PaymentStatus::Pending,
        };

        return new PaymentNotification(
            orderNumber: (string) ($payload['order_id'] ?? ''),
            transactionId: (string) ($payload['transaction_id'] ?? ''),
            status: $status,
            amount: (int) round((float) ($payload['gross_amount'] ?? 0)),
            paymentMethod: isset($payload['payment_type']) ? (string) $payload['payment_type'] : null,
            rawPayload: $payload,
        );
    }

    private function serverKey(): string
    {
        return (string) config('menanti.payment.midtrans.server_key', '');
    }

    private function snapUrl(): string
    {
        $configured = (string) config('menanti.payment.midtrans.snap_url', '');

        if ($configured !== '') {
            return $configured;
        }

        return (bool) config('menanti.payment.midtrans.is_production', false)
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }

    private function apiUrl(): string
    {
        $configured = (string) config('menanti.payment.midtrans.api_url', '');

        if ($configured !== '') {
            return rtrim($configured, '/');
        }

        return (bool) config('menanti.payment.midtrans.is_production', false)
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }
}
