<?php

declare(strict_types=1);

namespace App\Domain\Cart\Exceptions;

use RuntimeException;

class CartExpiredException extends RuntimeException
{
    public static function because(): self
    {
        return new self('Keranjang sudah kedaluwarsa. Silakan mulai pesanan baru.');
    }
}
