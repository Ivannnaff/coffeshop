<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Domain\Payment\DTO\PaymentInitiation;
use App\Domain\Payment\DTO\PaymentNotification;
use App\Enums\PaymentGateway as PaymentGatewayType;
use App\Models\Order;

/**
 * Kontrak gateway pembayaran. Semua akses ke penyedia pembayaran
 * harus lewat interface ini (07-CODING-RULES.md bagian 5).
 */
interface PaymentGateway
{
    public function name(): PaymentGatewayType;

    /**
     * Membuat transaksi pembayaran di gateway.
     */
    public function createTransaction(Order $order, int $expiryMinutes): PaymentInitiation;

    /**
     * Memverifikasi signature payload webhook sebelum payload dibaca.
     *
     * @param  array<string, mixed>  $payload
     */
    public function verifySignature(array $payload): bool;

    /**
     * Menutup transaksi yang masih terbuka di gateway agar status lokal
     * dan status gateway tetap sinkron (B-09).
     */
    public function expireTransaction(Order $order): void;

    /**
     * Mengubah payload webhook menjadi DTO netral.
     *
     * @param  array<string, mixed>  $payload
     */
    public function parseNotification(array $payload): PaymentNotification;
}
