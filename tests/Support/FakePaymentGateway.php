<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Contracts\PaymentGateway;
use App\Domain\Payment\DTO\PaymentInitiation;
use App\Domain\Payment\DTO\PaymentNotification;
use App\Enums\PaymentGateway as PaymentGatewayEnum;
use App\Enums\PaymentStatus;
use App\Models\Order;

class FakePaymentGateway implements PaymentGateway
{
    public function name(): PaymentGatewayEnum
    {
        return PaymentGatewayEnum::Midtrans;
    }

    public function createTransaction(Order $order, int $expiryMinutes): PaymentInitiation
    {
        return new PaymentInitiation(
            transactionId: 'FAKE-TRX-'.$order->id,
            redirectUrl: 'https://sandbox.example.test/pay/'.$order->order_number,
            token: 'fake-token',
            rawResponse: [
                'token' => 'fake-token',
                'redirect_url' => 'https://sandbox.example.test/pay/'.$order->order_number,
            ],
        );
    }

    public function verifySignature(array $payload): bool
    {
        return true;
    }

    public function parseNotification(array $payload): PaymentNotification
    {
        return new PaymentNotification(
            orderNumber: (string) ($payload['order_id'] ?? ''),
            transactionId: (string) ($payload['transaction_id'] ?? ''),
            status: PaymentStatus::Settled,
            amount: (int) ($payload['gross_amount'] ?? 0),
            paymentMethod: null,
            rawPayload: $payload,
        );
    }
}
