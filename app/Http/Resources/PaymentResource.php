<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Payment $payment */
        $payment = $this->resource;
        $rawPayload = is_array($payment->raw_payload) ? $payment->raw_payload : [];

        return [
            'gateway' => $payment->gateway->value,
            'status' => $payment->status->value,
            'amount' => $payment->amount,
            'payment_method' => $payment->payment_method,
            'redirect_url' => isset($rawPayload['redirect_url']) ? (string) $rawPayload['redirect_url'] : null,
            'token' => isset($rawPayload['token']) ? (string) $rawPayload['token'] : null,
        ];
    }
}
