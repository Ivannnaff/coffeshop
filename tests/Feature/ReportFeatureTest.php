<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Enums\StatusActorType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\OrderStatusService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReportFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();

        // Kunci waktu agar konsisten dengan Asia/Jakarta
        $this->travelTo(Carbon::create(2026, 11, 10, 10, 0, 0, 'Asia/Jakarta'));

        StoreSetting::create([
            'store_id' => 1,
            'name' => 'Menanti Coffee',
            'timezone' => 'Asia/Jakarta',
            'is_accepting_orders' => true,
        ]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@menanti.test',
            'password' => bcrypt('password12345'),
            'role' => Role::Admin,
            'is_active' => true,
        ]);
    }

    public function test_report_summary_calculates_revenue_orders_items_and_top_products_correctly(): void
    {
        $this->actingAs($this->admin);

        // Buat pesanan PAID (dihitung sebagai penjualan)
        $order1 = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0001',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::Paid,
            'customer_name' => 'Andi',
            'customer_phone' => '081234567890',
            'subtotal' => 50000,
            'eligible_subtotal' => 50000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 50000,
            'min_item_price_snapshot' => 15000,
            'paid_at' => Carbon::create(2026, 11, 10, 9, 30, 0, 'Asia/Jakarta'),
            'expires_at' => now()->addMinutes(15),
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => null,
            'product_name' => 'Caramel Latte',
            'base_price' => 25000,
            'unit_price' => 25000,
            'qty' => 2,
            'line_total' => 50000,
        ]);

        // Buat pesanan PENDING_PAYMENT (tidak dihitung sebagai penjualan)
        Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0002',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Budi',
            'customer_phone' => '081234567891',
            'subtotal' => 30000,
            'eligible_subtotal' => 30000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 30000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->getJson('/admin/reports/summary?from=2026-11-01&to=2026-11-30');

        $response->assertOk()
            ->assertJsonPath('data.total_revenue', 50000)
            ->assertJsonPath('data.total_orders', 1)
            ->assertJsonPath('data.total_items_sold', 2)
            ->assertJsonPath('data.top_products.0.name', 'Caramel Latte')
            ->assertJsonPath('data.top_products.0.qty', 2);
    }

    public function test_report_cache_invalidates_when_order_status_changes(): void
    {
        $this->actingAs($this->admin);

        $order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-0003',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::PendingPayment,
            'customer_name' => 'Citra',
            'customer_phone' => '081234567892',
            'subtotal' => 25000,
            'eligible_subtotal' => 25000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 25000,
            'min_item_price_snapshot' => 15000,
            'expires_at' => now()->addMinutes(15),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => null,
            'product_name' => 'Americano',
            'base_price' => 25000,
            'unit_price' => 25000,
            'qty' => 1,
            'line_total' => 25000,
        ]);

        // Request pertama (kosong karena PENDING_PAYMENT)
        $res1 = $this->getJson('/admin/reports/summary?from=2026-11-01&to=2026-11-30');
        $res1->assertOk()->assertJsonPath('data.total_revenue', 0);

        // Ubah status order menjadi PAID lewat OrderStatusService (akan mentrigger invalidation)
        /** @var OrderStatusService $statusService */
        $statusService = app(OrderStatusService::class);
        $statusService->transition($order, OrderStatus::Paid, StatusActorType::Webhook, null, 'Bayar');
        $order->update(['paid_at' => now()]); // pastikan paid_at terisi

        // Request kedua harus mengambil data terbaru (revenue 25000) karena cache ter-invalidate
        $res2 = $this->getJson('/admin/reports/summary?from=2026-11-01&to=2026-11-30');
        $res2->assertOk()->assertJsonPath('data.total_revenue', 25000);
    }
}
