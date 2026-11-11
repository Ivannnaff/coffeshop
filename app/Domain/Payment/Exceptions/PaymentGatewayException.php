<?php

declare(strict_types=1);

namespace App\Domain\Payment\Exceptions;

use RuntimeException;

class PaymentGatewayException extends RuntimeException
{
    public static function because(string $reason): self
    {
        return new self("Gateway pembayaran gagal: {$reason}");
    }
}
