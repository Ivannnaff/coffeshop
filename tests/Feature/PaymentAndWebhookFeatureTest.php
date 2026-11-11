<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class PaymentAndWebhookFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected StoreSetting $storeSetting;

    protected Product $product;

    protected ProductVariant $variant;

    protected string $serverKey = 'test-server-key';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();

        // Kunci waktu ke jam operasional agar test tidak bergantung jam mesin.
        $this->travelTo(Carbon::create(2026, 11, 10, 10, 0, 0, 'Asia/Jakarta'));

        config(['services.midtrans.server_key' => $this->serverKey]);
        config(['menanti.payment.midtrans.server_key' => $this->serverKey]);

        $this->storeSetting = StoreSetting::create([
            'store_id' => 1,
            'name' => 'Menanti Coffee',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
            'is_accepting_orders' => true,
            'opening_time' => '08:00:00',
            'closing_time' => '22:00:00',
            'timezone' => 'Asia/Jakarta',
            'delivery_min_item_price' => 15000,
            'payment_expiry_minutes' => 15,
        ]);

        $category = Category::create([
            'name' => 'Coffee',
            'slug' => 'coffee',
            'sort_order' => 1,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Kopi Susu Menanti',
            'slug' => 'kopi-susu-menanti',
            'base_price' => 20000,
            'is_active' => true,
            'is_sold_out' => false,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'type' => 'size',
            'name' => 'Regular',
            'price_delta' => 0,
        ]);
    }

    public function test_checkout_creates_pending_order_with_payment(): void
    {
        $this->app->instance(PaymentGateway::class, new FakePaymentGateway);

        $cartResponse = $this->getJson('/api/public/cart');
        $cartToken = $cartResponse->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'qty' => 2,
            ]);

        $checkoutResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Budi Santoso',
                'customer_phone' => '081234567890',
                'mode' => 'takeaway',
            ]);

        $checkoutResponse->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'order_number',
                    'public_token',
                    'status',
                    'total',
                    'payment' => [
                        'gateway',
                        'status',
                        'amount',
                        'redirect_url',
                    ],
                ],
            ]);

        $this->assertEquals(OrderStatus::PendingPayment->value, $checkoutResponse->json('data.status'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_webhook_valid_signature_settles_payment_and_transitions_order(): void
    {
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0001',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Test Customer',
            'customer_phone' => '081234567890',
            'subtotal' => 40000,
            'eligible_subtotal' => 40000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 40000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(15),
        ]);

        Payment::create([
            'order_id' => $order->id,
            'gateway' => 'midtrans',
            'gateway_transaction_id' => 'TRX-999',
            'amount' => 40000,
            'status' => 'pending',
            'signature_valid' => false,
        ]);

        $orderId = 'MNT-261110-0001';
        $statusCode = '200';
        $grossAmount = '40000.00';
        $signatureKey = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'transaction_id' => 'TRX-999',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/webhooks/payment/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('result', 'processed');

        $this->assertEquals(OrderStatus::Paid, $order->fresh()->status);
        $this->assertNotNull($order->fresh()->paid_at);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway_transaction_id' => 'TRX-999',
            'status' => 'settled',
            'signature_valid' => true,
        ]);
        $this->assertDatabaseHas('webhook_events', [
            'gateway' => 'midtrans',
            'result' => 'processed',
        ]);
    }

    public function test_webhook_invalid_signature_rejected(): void
    {
        $payload = [
            'order_id' => 'MNT-261110-0002',
            'status_code' => '200',
            'gross_amount' => '40000.00',
            'signature_key' => 'wrong-signature',
            'transaction_status' => 'settlement',
            'transaction_id' => 'TRX-888',
        ];

        $response = $this->postJson('/webhooks/payment/midtrans', $payload);

        $response->assertStatus(401)
            ->assertJsonPath('result', 'rejected');

        $this->assertDatabaseHas('webhook_events', [
            'result' => 'rejected',
        ]);
    }

    public function test_webhook_amount_mismatch_is_rejected(): void
    {
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0005',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Test Customer',
            'customer_phone' => '081234567890',
            'subtotal' => 40000,
            'eligible_subtotal' => 40000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 40000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(15),
        ]);

        $orderId = 'MNT-261110-0005';
        $statusCode = '200';
        $grossAmount = '10000.00';
        $signatureKey = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $response = $this->postJson('/webhooks/payment/midtrans', [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'transaction_id' => 'TRX-555',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('result', 'rejected');

        $this->assertEquals(OrderStatus::PendingPayment, $order->fresh()->status);
        $this->assertDatabaseHas('webhook_events', ['result' => 'rejected']);
    }

    public function test_webhook_idempotency_duplicate(): void
    {
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0003',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::Paid,
            'customer_name' => 'Test Customer',
            'customer_phone' => '081234567890',
            'subtotal' => 40000,
            'eligible_subtotal' => 40000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 40000,
            'min_item_price_snapshot' => 15000,
            'paid_at' => now(),
            'expires_at' => now()->addMinutes(15),
        ]);

        Payment::create([
            'order_id' => $order->id,
            'gateway' => 'midtrans',
            'gateway_transaction_id' => 'TRX-777',
            'amount' => 40000,
            'status' => 'settled',
            'signature_valid' => true,
        ]);

        $orderId = 'MNT-261110-0003';
        $statusCode = '200';
        $grossAmount = '40000.00';
        $signatureKey = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'transaction_id' => 'TRX-777',
        ];

        $response = $this->postJson('/webhooks/payment/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('result', 'duplicate');
    }

    public function test_webhook_late_after_expired(): void
    {
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0004',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::Expired,
            'customer_name' => 'Test Customer',
            'customer_phone' => '081234567890',
            'subtotal' => 40000,
            'eligible_subtotal' => 40000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 40000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->subMinute(),
        ]);

        $orderId = 'MNT-261110-0004';
        $statusCode = '200';
        $grossAmount = '40000.00';
        $signatureKey = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'transaction_id' => 'TRX-666',
        ];

        $response = $this->postJson('/webhooks/payment/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('result', 'late_after_expired');

        // Status pesanan tetap EXPIRED, tapi payment tercatat settled
        $this->assertEquals(OrderStatus::Expired, $order->fresh()->status);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'settled',
        ]);
    }
}
