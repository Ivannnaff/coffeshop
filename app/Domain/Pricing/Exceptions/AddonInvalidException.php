<?php

declare(strict_types=1);

namespace App\Domain\Pricing\Exceptions;

use RuntimeException;

class AddonInvalidException extends RuntimeException
{
    public static function because(string $message): self
    {
        return new self("Validasi add-on gagal: {$message}");
    }
}
