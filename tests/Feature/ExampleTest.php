<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        StoreSetting::create([
            'store_id' => 1,
            'name' => 'Menanti Coffee',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
            'is_accepting_orders' => true,
            'opening_time' => '00:00:00',
            'closing_time' => '23:59:59',
            'timezone' => 'Asia/Jakarta',
            'delivery_min_item_price' => 15000,
            'payment_expiry_minutes' => 60,
        ]);
    }

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
