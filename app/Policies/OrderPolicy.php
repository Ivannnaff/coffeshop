<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/**
 * Otorisasi KDS. Middleware role menangani akses route,
 * policy ini menjadi lapisan kedua untuk aksi per pesanan.
 * Lihat 06-SECURITY.md bagian 6.
 */
class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && ($user->isAdmin() || $user->isBarista());
    }

    public function transition(User $user, Order $order): bool
    {
        return $user->is_active && ($user->isAdmin() || $user->isBarista());
    }
}
