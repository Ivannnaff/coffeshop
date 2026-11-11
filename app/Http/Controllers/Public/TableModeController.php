<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ResolveCart;
use App\Models\Table;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TableModeController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function showTable(Request $request, string $qrToken): Response
    {
        /** @var Table $table */
        $table = Table::query()
            ->where('qr_token', $qrToken)
            ->where('is_active', true)
            ->firstOrFail();

        $cart = ResolveCart::cart($request);
        $cart->update([
            'table_id' => $table->id,
            'mode' => 'dine_in',
        ]);

        $redirectUrl = (string) config('menanti.menu_url', '/api/public/menu');

        return redirect($redirectUrl);
    }

    public function updateMode(Request $request): JsonResponse
    {
        $request->validate([
            'mode' => ['required', 'string', 'in:takeaway,delivery'],
        ]);

        $cart = ResolveCart::cart($request);

        if ($cart->mode?->value === 'dine_in') {
            return response()->json([
                'message' => 'Mode pesanan dari meja (dine-in) tidak dapat diubah secara manual.',
                'code' => 'DINE_IN_LOCKED',
            ], 422);
        }

        $cart->update([
            'mode' => $request->string('mode')->toString(),
            'table_id' => null,
        ]);

        return response()->json([
            'data' => [
                'mode' => $cart->mode->value,
            ],
        ]);
    }
}
