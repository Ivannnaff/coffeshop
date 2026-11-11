<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTO;

final readonly class PaymentInitiation
{
    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public ?string $transactionId,
        public string $redirectUrl,
        public ?string $token,
        public array $rawResponse,
    ) {}
}
