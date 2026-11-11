<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderMode;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class KdsAndAdminFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $barista;

    protected User $inactiveStaff;

    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();

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

        $this->barista = User::create([
            'name' => 'Barista User',
            'email' => 'barista@menanti.test',
            'password' => bcrypt('password12345'),
            'role' => Role::Barista,
            'is_active' => true,
        ]);

        $this->inactiveStaff = User::create([
            'name' => 'Inactive Staff',
            'email' => 'inactive@menanti.test',
            'password' => bcrypt('password12345'),
            'role' => Role::Barista,
            'is_active' => false,
        ]);

        $this->order = Order::create([
            'store_id' => 1,
            'order_number' => 'MNT-261110-9999',
            'public_token' => Str::random(48),
            'mode' => OrderMode::Takeaway,
            'status' => OrderStatus::Paid,
            'customer_name' => 'Budi',
            'customer_phone' => '081234567890',
            'subtotal' => 20000,
            'eligible_subtotal' => 20000,
            'delivery_fee' => 0,
            'delivery_discount' => 0,
            'total' => 20000,
            'min_item_price_snapshot' => 15000,
            'paid_at' => now(),
            'expires_at' => now()->addMinutes(15),
        ]);
    }

    public function test_guests_cannot_access_kds_or_admin(): void
    {
        $this->getJson('/kds/orders')->assertStatus(401);
        $this->getJson('/admin/store-settings')->assertStatus(401);
    }

    public function test_inactive_staff_cannot_login(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'inactive@menanti.test',
            'password' => 'password12345',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_barista_can_access_kds_and_transition_order(): void
    {
        $this->actingAs($this->barista);

        $response = $this->getJson('/kds/orders');
        $response->assertOk()
            ->assertJsonCount(1, 'data');

        // Barista cannot access admin endpoints
        $this->getJson('/admin/store-settings')->assertStatus(403);

        // Transition PAID -> PREPARING
        $transitionResponse = $this->postJson("/kds/orders/{$this->order->id}/start", [
            'note' => 'Mulai meracik',
        ]);

        $transitionResponse->assertOk()
            ->assertJsonPath('data.status', 'PREPARING');

        $this->assertEquals(OrderStatus::Preparing, $this->order->fresh()->status);
    }

    public function test_admin_can_access_admin_and_kds(): void
    {
        $this->actingAs($this->admin);

        // Admin can access KDS
        $this->getJson('/kds/orders')->assertOk();

        // Admin can access Store Settings
        $this->getJson('/admin/store-settings')->assertOk()
            ->assertJsonPath('data.name', 'Menanti Coffee');

        // Admin can CRUD Categories
        $catResponse = $this->postJson('/admin/categories', [
            'name' => 'Signature Coffee',
            'sort_order' => 1,
        ]);

        $catResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Signature Coffee');

        $catId = $catResponse->json('data.id');

        // Admin Reports summary
        $reportResponse = $this->getJson('/admin/reports/summary');
        $reportResponse->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'from',
                    'to',
                    'total_revenue',
                    'total_orders',
                    'total_items_sold',
                    'top_products',
                ],
            ]);
    }
}
