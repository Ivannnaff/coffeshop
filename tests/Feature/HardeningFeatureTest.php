<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class HardeningFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_are_present(): void
    {
        $response = $this->get('/health');

        $response->assertOk()
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/health');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonStructure([
                'status',
                'checks' => [
                    'database',
                    'cache',
                    'storage',
                    'queue',
                ],
                'timestamp',
            ]);
    }

    public function test_admin_actions_are_audited(): void
    {
        Log::shouldReceive('channel')
            ->once()
            ->with('audit')
            ->andReturnSelf();

        Log::shouldReceive('info')
            ->once()
            ->with('Admin action executed', \Mockery::any());

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@menanti.test',
            'password' => bcrypt('password12345'),
            'role' => Role::Admin,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        $response = $this->postJson('/admin/categories', [
            'name' => 'Minuman Baru',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response->assertCreated();
    }
}
