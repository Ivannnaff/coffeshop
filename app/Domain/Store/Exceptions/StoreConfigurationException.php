<?php

declare(strict_types=1);

namespace App\Domain\Store\Exceptions;

use RuntimeException;

class StoreConfigurationException extends RuntimeException
{
    public static function missingDeliveryCoordinates(): self
    {
        return new self('Koordinat toko belum dikonfigurasi pada store_settings.');
    }

    public static function missingStoreSettings(): self
    {
        return new self('store_settings belum diisi.');
    }
}
