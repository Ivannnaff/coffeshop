<?php

declare(strict_types=1);

namespace App\Domain\Pricing\Exceptions;

use RuntimeException;

class ProductUnavailableException extends RuntimeException
{
    public static function because(string $productName): self
    {
        return new self("Produk '{$productName}' sedang tidak tersedia atau sold out.");
    }
}
