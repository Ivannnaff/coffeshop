<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'PENDING_PAYMENT';
    case Paid = 'PAID';
    case Preparing = 'PREPARING';
    case Ready = 'READY';
    case OutForDelivery = 'OUT_FOR_DELIVERY';
    case Completed = 'COMPLETED';
    case Expired = 'EXPIRED';

    /**
     * Status yang dihitung sebagai penjualan pada laporan.
     * Lihat 04-BUSINESS-RULES.md bagian 7.
     *
     * @return array<int, self>
     */
    public static function countedAsSales(): array
    {
        return [
            self::Paid,
            self::Preparing,
            self::Ready,
            self::OutForDelivery,
            self::Completed,
        ];
    }

    /**
     * Status akhir: pesanan tidak boleh berubah lagi.
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::Completed, self::Expired], true);
    }
}
