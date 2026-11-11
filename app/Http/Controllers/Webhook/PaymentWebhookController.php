<?php

declare(strict_types=1);

namespace App\Http\Controllers\Webhook;

use App\Enums\WebhookResult;
use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function midtrans(Request $request): JsonResponse
    {
        $payload = (array) $request->all();

        $result = $this->paymentService->processWebhook($payload);

        if ($result === WebhookResult::Rejected) {
            return response()->json([
                'message' => 'Webhook ditolak (signature atau data tidak valid).',
                'result' => $result->value,
            ], 401);
        }

        return response()->json([
            'message' => 'Webhook berhasil diproses.',
            'result' => $result->value,
        ], 200);
    }
}
