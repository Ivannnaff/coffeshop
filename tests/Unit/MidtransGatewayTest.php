<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Domain\Payment\Exceptions\PaymentGatewayException;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\Payment\MidtransGateway;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransGatewayTest extends TestCase
{
    private MidtransGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();

        config(['menanti.payment.midtrans.server_key' => 'server-key-test']);
        $this->gateway = new MidtransGateway;
    }

    public function test_signature_is_valid_with_correct_hash(): void
    {
        $payload = [
            'order_id' => 'MNT-261110-0001',
            'status_code' => '200',
            'gross_amount' => '42000.00',
            'signature_key' => hash('sha512', 'MNT-261110-000120042000.00server-key-test'),
        ];

        $this->assertTrue($this->gateway->verifySignature($payload));
    }

    public function test_signature_is_invalid_when_payload_changes(): void
    {
        $payload = [
            'order_id' => 'MNT-261110-0001',
            'status_code' => '200',
            'gross_amount' => '42000.00',
            'signature_key' => hash('sha512', 'MNT-261110-000120042000.00other-key'),
        ];

        $this->assertFalse($this->gateway->verifySignature($payload));
    }

    public function test_signature_is_invalid_when_server_key_is_missing(): void
    {
        config(['menanti.payment.midtrans.server_key' => '']);

        $this->assertFalse($this->gateway->verifySignature([
            'order_id' => 'MNT-261110-0001',
            'status_code' => '200',
            'gross_amount' => '42000.00',
            'signature_key' => 'anything',
        ]));
    }

    public function test_parse_settlement_notification(): void
    {
        $notification = $this->gateway->parseNotification([
            'order_id' => 'MNT-261110-0001',
            'transaction_id' => 'TRX-1',
            'transaction_status' => 'settlement',
            'gross_amount' => '42000.00',
            'payment_type' => 'qris',
        ]);

        $this->assertSame('MNT-261110-0001', $notification->orderNumber);
        $this->assertSame('TRX-1', $notification->transactionId);
        $this->assertSame(PaymentStatus::Settled, $notification->status);
        $this->assertSame(42000, $notification->amount);
        $this->assertSame('qris', $notification->paymentMethod);
    }

    public function test_capture_with_accept_fraud_status_is_settled(): void
    {
        $notification = $this->gateway->parseNotification([
            'order_id' => 'MNT-261110-0002',
            'transaction_id' => 'TRX-2',
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
            'gross_amount' => '15000.00',
        ]);

        $this->assertSame(PaymentStatus::Settled, $notification->status);
    }

    public function test_expire_notification_maps_to_expired(): void
    {
        $notification = $this->gateway->parseNotification([
            'order_id' => 'MNT-261110-0003',
            'transaction_id' => 'TRX-3',
            'transaction_status' => 'expire',
            'gross_amount' => '15000.00',
        ]);

        $this->assertSame(PaymentStatus::Expired, $notification->status);
    }

    public function test_pending_notification_maps_to_pending(): void
    {
        $notification = $this->gateway->parseNotification([
            'order_id' => 'MNT-261110-0004',
            'transaction_id' => 'TRX-4',
            'transaction_status' => 'pending',
            'gross_amount' => '15000.00',
        ]);

        $this->assertSame(PaymentStatus::Pending, $notification->status);
    }

    public function test_create_transaction_calls_snap_and_returns_redirect_url(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/snap-token',
            ], 201),
        ]);

        $order = new Order([
            'order_number' => 'MNT-261110-0009',
            'customer_name' => 'Budi',
            'customer_phone' => '081234567890',
            'total' => 42000,
        ]);

        $initiation = $this->gateway->createTransaction($order, 15);

        $this->assertSame('https://app.sandbox.midtrans.com/snap/v4/redirection/snap-token', $initiation->redirectUrl);
        $this->assertSame('snap-token', $initiation->token);

        Http::assertSent(function ($request): bool {
            return $request->url() === 'https://app.sandbox.midtrans.com/snap/v1/transactions'
                && $request['transaction_details']['order_id'] === 'MNT-261110-0009'
                && $request['transaction_details']['gross_amount'] === 42000
                && $request['expiry']['duration'] === 15;
        });
    }

    public function test_create_transaction_requires_server_key(): void
    {
        config(['menanti.payment.midtrans.server_key' => '']);

        $order = new Order([
            'order_number' => 'MNT-261110-0010',
            'customer_name' => 'Budi',
            'customer_phone' => '081234567890',
            'total' => 42000,
        ]);

        $this->expectException(PaymentGatewayException::class);

        $this->gateway->createTransaction($order, 15);
    }
}
