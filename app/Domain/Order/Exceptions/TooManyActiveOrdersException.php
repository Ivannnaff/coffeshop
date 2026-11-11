<?php

declare(strict_types=1);

namespace App\Domain\Order\Exceptions;

use RuntimeException;

class TooManyActiveOrdersException extends RuntimeException
{
    public static function because(int $limit): self
    {
        return new self("Terlalu banyak pesanan aktif untuk nomor WhatsApp ini. Maksimal {$limit} pesanan yang belum dibayar.");
    }
}
