<?php

declare(strict_types=1);

namespace App\Domain\Store;

use Carbon\CarbonInterface;

/**
 * Aturan jam operasional toko.
 * Lihat 04-BUSINESS-RULES.md bagian 6.
 */
final class StoreOpeningHours
{
    /**
     * Jam buka boleh melewati tengah malam (contoh 18:00 - 02:00).
     */
    public function isOpen(CarbonInterface $now, ?string $openingTime, ?string $closingTime): bool
    {
        if ($openingTime === null || $closingTime === null) {
            return true;
        }

        $current = $now->format('H:i:s');

        if ($openingTime <= $closingTime) {
            return $current >= $openingTime && $current < $closingTime;
        }

        return $current >= $openingTime || $current < $closingTime;
    }
}
