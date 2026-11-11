<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Jobs\ExpireUnpaidOrdersJob;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Category;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StoreSetting;
use App\Services\OrderStatusService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class CartAndCheckoutFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected StoreSetting $storeSetting;

    protected Product $product;

    protected ProductVariant $variant;

    protected Addon $addon;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();

        // Kunci waktu ke jam operasional
        $this->travelTo(Carbon::create(2026, 11, 10, 10, 0, 0, 'Asia/Jakarta'));

        $this->app->instance(PaymentGateway::class, new FakePaymentGateway);

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
            'payment_expiry_minutes' => 60,
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

        $group = AddonGroup::create([
            'name' => 'Topping',
            'selection_type' => 'multiple',
            'min_select' => 0,
            'max_select' => 2,
        ]);
        $group->products()->attach($this->product->id);

        $this->addon = Addon::create([
            'addon_group_id' => $group->id,
            'name' => 'Extra Espresso',
            'price_delta' => 5000,
            'is_active' => true,
            'is_sold_out' => false,
        ]);
    }

    public function test_can_view_cart_and_add_items(): void
    {
        $response = $this->getJson('/api/public/cart');
        $response->assertOk();
        $cartToken = $response->json('data.token');

        // Add item
        $addResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'addon_ids' => [$this->addon->id],
                'qty' => 2,
                'note' => 'Less ice',
            ]);

        $addResponse->assertOk()
            ->assertJsonPath('data.subtotal', 50000); // (20k + 5k) * 2

        $itemId = $addResponse->json('data.items.0.id');

        // Update item qty
        $updateResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->patchJson("/api/public/cart/items/{$itemId}", [
                'qty' => 1,
            ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.subtotal', 25000);

        // Remove item
        $deleteResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->deleteJson("/api/public/cart/items/{$itemId}");

        $deleteResponse->assertOk()
            ->assertJsonPath('data.subtotal', 0);
    }

    public function test_checkout_preview_and_checkout_takeaway(): void
    {
        $cartResponse = $this->getJson('/api/public/cart');
        $cartToken = $cartResponse->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'qty' => 2,
            ]);

        // Preview
        $previewResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout/preview', [
                'mode' => 'takeaway',
            ]);

        $previewResponse->assertOk()
            ->assertJsonPath('data.subtotal', 40000)
            ->assertJsonPath('data.delivery_fee', 0)
            ->assertJsonPath('data.total', 40000);

        // Checkout
        $checkoutResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Budi Santoso',
                'customer_phone' => '081234567890',
                'mode' => 'takeaway',
                'pickup_note' => 'Segera ya',
            ]);

        $checkoutResponse->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'order_number',
                    'public_token',
                    'status',
                    'mode',
                    'total',
                ],
            ]);

        $this->assertEquals(OrderStatus::PendingPayment->value, $checkoutResponse->json('data.status'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_status_logs', 1);
    }

    public function test_checkout_delivery_with_zone(): void
    {
        $zone = DeliveryZone::create([
            'name' => 'Zone A',
            'max_distance_km' => 5.00,
            'base_fee' => 10000,
            'free_fee_min_subtotal' => null,
            'is_active' => true,
        ]);

        $cartResponse = $this->getJson('/api/public/cart');
        $cartToken = $cartResponse->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'qty' => 1,
            ]);

        // Lat/Lon close to store (-6.2000, 106.8166) -> e.g. (-6.2020, 106.8180)
        $previewResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout/preview', [
                'mode' => 'delivery',
                'latitude' => -6.2020,
                'longitude' => 106.8180,
            ]);

        $previewResponse->assertOk()
            ->assertJsonPath('data.delivery_fee', 10000)
            ->assertJsonPath('data.total', 30000); // 20k + 10k fee

        $checkoutResponse = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Siti Aminah',
                'customer_phone' => '081987654321',
                'mode' => 'delivery',
                'delivery' => [
                    'address' => 'Jl. Sudirman No. 1',
                    'latitude' => -6.2020,
                    'longitude' => 106.8180,
                ],
            ]);

        $checkoutResponse->assertStatus(201);
        $this->assertDatabaseHas('orders', [
            'customer_phone' => '081987654321',
            'delivery_zone_id' => $zone->id,
            'delivery_fee' => 10000,
        ]);
    }

    public function test_store_closed_exception(): void
    {
        $this->storeSetting->update(['is_accepting_orders' => false]);

        $cartResponse = $this->getJson('/api/public/cart');
        $cartToken = $cartResponse->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'qty' => 1,
            ]);

        $response = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Budi',
                'customer_phone' => '081234567890',
                'mode' => 'takeaway',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('code', 'STORE_CLOSED');
    }

    public function test_too_many_active_orders_rate_limit(): void
    {
        $phone = '081234567899';

        // Buat 3 pesanan aktif
        for ($i = 0; $i < 3; $i++) {
            Order::create([
                'store_id' => 1,
                'order_number' => "MNT-261110-000{$i}",
                'public_token' => Str::random(48),
                'mode' => OrderMode::Takeaway,
                'status' => OrderStatus::PendingPayment,
                'customer_name' => 'Test',
                'customer_phone' => $phone,
                'subtotal' => 20000,
                'eligible_subtotal' => 20000,
                'delivery_fee' => 0,
                'delivery_discount' => 0,
                'total' => 20000,
                'min_item_price_snapshot' => 15000,
                'expires_at' => now()->addHour(),
            ]);
        }

        $cartResponse = $this->getJson('/api/public/cart');
        $cartToken = $cartResponse->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $this->product->id,
                'variant_ids' => [$this->variant->id],
                'qty' => 1,
            ]);

        $response = $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Test',
                'customer_phone' => $phone,
                'mode' => 'takeaway',
            ]);

        $response->assertStatus(429)
            ->assertJsonPath('code', 'RATE_LIMITED');
    }

    public function test_expire_unpaid_orders_job(): void
    {
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-9999',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Test Expired',
            'customer_phone' => '081234567800',
            'subtotal' => 20000,
            'eligible_subtotal' => 20000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 20000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->subMinute(), // sudah kedaluwarsa
        ]);

        (new ExpireUnpaidOrdersJob)->handle(
            app(OrderStatusService::class),
            app(PaymentGateway::class),
        );

        $this->assertEquals(OrderStatus::Expired, $order->fresh()->status);
    }
}
