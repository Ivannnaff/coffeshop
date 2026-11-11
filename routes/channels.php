<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel privat KDS. Hanya staf aktif (barista/admin) yang boleh berlangganan.
// Channel publik pelanggan `order.{public_token}` tidak butuh otorisasi karena
// token acak 48 karakter dan hanya berisi status pesanan tanpa data pribadi.
Broadcast::channel('kds.store.{storeId}', function (User $user, int $storeId): bool {
    return $user->is_active && ($user->isAdmin() || $user->isBarista());
});
