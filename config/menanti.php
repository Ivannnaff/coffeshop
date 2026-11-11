<?php

declare(strict_types=1);

return [

    /*
    | Prefix nomor pesanan, contoh MNT-261110-0042.
    */
    'order_number_prefix' => env('ORDER_NUMBER_PREFIX', 'MNT'),

    /*
    | Umur keranjang sejak aktivitas terakhir.
    */
    'cart_ttl_hours' => (int) env('CART_TTL_HOURS', 24),

    /*
    | Umur cookie cart_token di browser (menit).
    */
    'cart_cookie_minutes' => (int) env('CART_COOKIE_MINUTES', 60 * 24 * 7),

    /*
    | Batas pesanan PENDING_PAYMENT aktif per nomor WhatsApp.
    */
    'active_order_limit_per_phone' => (int) env('ACTIVE_ORDER_LIMIT_PER_PHONE', 3),

    /*
    | URL halaman menu frontend setelah pelanggan memindai QR meja.
    */
    'menu_url' => env('MENU_URL', '/api/public/menu'),

    /*
    | Pembayaran. Gateway dipilih lewat PAYMENT_GATEWAY (saat ini: midtrans).
    */
    'payment' => [
        'gateway' => env('PAYMENT_GATEWAY', 'midtrans'),
        'finish_url' => env('PAYMENT_FINISH_URL', ''),

        'midtrans' => [
            'server_key' => env('MIDTRANS_SERVER_KEY', ''),
            'client_key' => env('MIDTRANS_CLIENT_KEY', ''),
            'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
            'snap_url' => env('MIDTRANS_SNAP_URL', ''),
            'api_url' => env('MIDTRANS_API_URL', ''),
        ],
    ],

];
