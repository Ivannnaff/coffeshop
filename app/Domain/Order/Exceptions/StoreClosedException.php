<?php

declare(strict_types=1);

namespace App\Domain\Order\Exceptions;

use RuntimeException;

class StoreClosedException extends RuntimeException
{
    public static function because(): self
    {
        return new self('Toko sedang tutup atau tidak menerima pesanan saat ini.');
    }
}
