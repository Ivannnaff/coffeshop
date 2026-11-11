<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTO;

use App\Enums\PaymentStatus;

final readonly class PaymentNotification
{
    /**
     * @param  array<string, mixed>  $rawPayload
     */
    public function __construct(
        public string $orderNumber,
        public string $transactionId,
        public PaymentStatus $status,
        public int $amount,
        public ?string $paymentMethod,
        public array $rawPayload,
    ) {}
}
