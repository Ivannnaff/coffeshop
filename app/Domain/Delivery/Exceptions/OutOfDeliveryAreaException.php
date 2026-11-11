<?php

declare(strict_types=1);

namespace App\Domain\Delivery\Exceptions;

use RuntimeException;

class OutOfDeliveryAreaException extends RuntimeException
{
    public static function because(): self
    {
        return new self('Lokasi pengiriman berada di luar area layanan delivery.');
    }
}
