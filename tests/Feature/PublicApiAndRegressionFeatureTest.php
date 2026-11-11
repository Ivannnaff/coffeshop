<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StoreSetting;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakePaymentGateway;
use Tests\TestCase;

class PublicApiAndRegressionFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->app->instance(PaymentGateway::class, new FakePaymentGateway);

        StoreSetting::create([
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
    }

    public function test_public_menu_and_search_endpoints(): void
    {
        $category = Category::create([
            'name' => 'Coffee',
            'slug' => 'coffee',
            'sort_order' => 1,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Latte Special',
            'slug' => 'latte-special',
            'base_price' => 25000,
            'is_active' => true,
            'is_sold_out' => false,
        ]);

        $this->getJson('/api/public/menu')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Coffee');

        $this->getJson('/api/public/menu/search?q=Latte')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Latte Special');
    }

    public function test_table_qr_resolution_and_mode_switch(): void
    {
        $table = Table::create([
            'store_id' => 1,
            'number' => '01',
            'qr_token' => 'qr-token-123',
            'is_active' => true,
        ]);

        $this->get("/meja/{$table->qr_token}")
            ->assertRedirect();

        // Mode switch
        $this->postJson('/api/public/mode', [
            'mode' => 'delivery',
        ])->assertOk()
            ->assertJsonPath('data.mode', 'delivery');
    }

    public function test_checkout_rejects_sold_out_item_r01(): void
    {
        $category = Category::create([
            'name' => 'Coffee',
            'slug' => 'coffee',
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Kopi Soldout',
            'slug' => 'kopi-soldout',
            'base_price' => 20000,
            'is_active' => true,
            'is_sold_out' => false,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'type' => 'size',
            'name' => 'Regular',
            'price_delta' => 0,
        ]);

        $cartRes = $this->getJson('/api/public/cart');
        $cartToken = $cartRes->json('data.token');

        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/cart/items', [
                'product_id' => $product->id,
                'variant_ids' => [$variant->id],
                'qty' => 1,
            ])
            ->assertOk();

        // Mark product sold out now
        $product->update(['is_sold_out' => true]);

        // Preview should also reject with 422 PRODUCT_UNAVAILABLE
        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout/preview', [
                'mode' => 'takeaway',
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');

        // Attempt checkout should fail with 422 PRODUCT_UNAVAILABLE
        $this->withUnencryptedCookie('cart_token', $cartToken)
            ->postJson('/api/public/checkout', [
                'customer_name' => 'Budi',
                'customer_phone' => '081234567890',
                'mode' => 'takeaway',
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_public_order_resource_masks_privacy_r03(): void
    {
        $order = $this->makeOrder('pub-token-xyz');

        $this->getJson("/api/public/orders/{$order->public_token}")
            ->assertOk()
            ->assertJsonPath('data.customer_name', 'B***');
    }

    public function test_retry_payment_only_for_pending_order(): void
    {
        $order = $this->makeOrder('retry-token');

        $this->postJson("/api/public/orders/{$order->public_token}/payment")
            ->assertStatus(201)
            ->assertJsonStructure(['data' => ['gateway', 'status', 'amount', 'redirect_url']]);

        $order->update(['status' => OrderStatus::Paid]);

        $this->postJson("/api/public/orders/{$order->public_token}/payment")
            ->assertStatus(422)
            ->assertJsonPath('code', 'INVALID_ORDER_STATE');
    }

    public function test_reorder_copies_items_into_cart(): void
    {
        $category = Category::create([
            'name' => 'Coffee',
            'slug' => 'coffee',
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Americano',
            'slug' => 'americano',
            'base_price' => 18000,
            'is_active' => true,
            'is_sold_out' => false,
        ]);

        $order = $this->makeOrder('reorder-token');
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'base_price' => 18000,
            'variant_delta' => 0,
            'addons_total' => 0,
            'discount_amount' => 0,
            'unit_price' => 18000,
            'qty' => 2,
            'line_total' => 36000,
            'is_delivery_eligible' => true,
        ]);

        $this->postJson("/api/public/orders/{$order->public_token}/reorder")
            ->assertOk()
            ->assertJsonPath('data.subtotal', 36000)
            ->assertJsonPath('skipped_items', []);
    }

    private function makeOrder(string $token): Order
    {
        /** @var Order $order */
        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-'.mb_substr(md5($token), 0, 4),
            'public_token' => $token,
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Budi Santoso',
            'customer_phone' => '081234567890',
            'subtotal' => 20000,
            'eligible_subtotal' => 20000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 20000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(30),
        ]);

        return $order;
    }
}
