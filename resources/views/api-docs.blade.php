<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumentasi API - Menanti Backend</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <style>
        body { font-family: 'Inter', sans-serif; }
        pre { tab-size: 2; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 antialiased">
    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-72 bg-slate-950 border-r border-slate-800 flex flex-col hidden lg:flex">
            <div class="p-6 border-b border-slate-800">
                <h1 class="text-xl font-bold text-amber-400">☕ Menanti API</h1>
                <p class="text-xs text-slate-400 mt-1">Dokumentasi Backend (Fase 1 - 8)</p>
            </div>
            <nav class="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Umum</p>
                    <ul class="space-y-1">
                        <li><a href="#overview" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Pengantar & Standar</a></li>
                        <li><a href="#errors" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Format Error</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Autentikasi Staf</p>
                    <ul class="space-y-1">
                        <li><a href="#staff-login" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">POST /login</a></li>
                        <li><a href="#staff-logout" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">POST /logout</a></li>
                        <li><a href="#staff-me" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">GET /me</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pelanggan (Publik)</p>
                    <ul class="space-y-1">
                        <li><a href="#public-cart" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Keranjang & Item</a></li>
                        <li><a href="#public-checkout" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Preview & Checkout</a></li>
                        <li><a href="#public-order" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Status Pesanan</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Webhook</p>
                    <ul class="space-y-1">
                        <li><a href="#webhook-midtrans" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">POST /webhooks/payment/midtrans</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">KDS (Barista & Admin)</p>
                    <ul class="space-y-1">
                        <li><a href="#kds-orders" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Antrean & Transisi Status</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</p>
                    <ul class="space-y-1">
                        <li><a href="#admin-categories" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Kategori</a></li>
                        <li><a href="#admin-products" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Produk, Varian & Add-on</a></li>
                        <li><a href="#admin-tables" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Meja & QR Token</a></li>
                        <li><a href="#admin-settings" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Pengaturan Toko</a></li>
                        <li><a href="#admin-delivery" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Zona & Aturan Ongkir</a></li>
                        <li><a href="#admin-reports" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Laporan Penjualan</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Real-time</p>
                    <ul class="space-y-1">
                        <li><a href="#realtime" class="block px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300">Reverb & Channel</a></li>
                    </ul>
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto p-8 lg:p-12 space-y-16">
            <!-- Header -->
            <section id="overview" class="space-y-4">
                <div class="inline-block bg-amber-500/10 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-500/20">Laravel 12 Backend</div>
                <h1 class="text-3xl font-extrabold tracking-tight text-white">Menanti Coffee Shop API Documentation</h1>
                <p class="text-slate-400 text-base leading-relaxed">
                    Dokumentasi resmi arsitektur backend Menanti. Semua nominal uang menggunakan integer rupiah (tanpa desimal/float), zona waktu <code class="text-amber-300">Asia/Jakarta</code>, dan validasi ketat via Form Request.
                </p>
            </section>

            <!-- Error Format -->
            <section id="errors" class="space-y-4 bg-slate-950 p-6 rounded-xl border border-slate-800">
                <h2 class="text-xl font-bold text-white">Format Error Standar</h2>
                <p class="text-slate-400 text-sm">Respon error API mengikuti format stabil berikut:</p>
                <pre class="bg-slate-900 p-4 rounded-lg text-emerald-400 text-xs overflow-x-auto border border-slate-800"><code>{
  "message": "Pesan ringkas untuk pengguna",
  "code": "VALIDATION_FAILED",
  "errors": {
    "field": ["Pesan detail kesalahan"]
  }
}</code></pre>
                <div class="flex flex-wrap gap-2 pt-2">
                    <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">VALIDATION_FAILED</span>
                    <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">PRODUCT_UNAVAILABLE</span>
                    <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">STORE_CLOSED</span>
                    <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">INVALID_TRANSITION</span>
                    <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">PAYMENT_GATEWAY_ERROR</span>
                </div>
            </section>

            <!-- Staff Auth -->
            <section id="staff-login" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Autentikasi Staf (Admin & Barista)</h2>
                    <p class="text-slate-400 text-sm mt-1">Autentikasi menggunakan Laravel Breeze session cookie.</p>
                </div>

                <!-- POST /login -->
                <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                        <code class="text-lg font-mono text-white">/login</code>
                    </div>
                    <p class="text-slate-300 text-sm">Masuk sebagai staf (admin atau barista). Staf dengan <code class="text-amber-300">is_active = false</code> ditolak.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-semibold text-slate-400 uppercase mb-2">Request Body (JSON)</p>
                            <pre class="bg-slate-900 p-3 rounded-lg text-amber-300 text-xs overflow-x-auto border border-slate-800"><code>{
  "email": "admin@menanti.test",
  "password": "password12345"
}</code></pre>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-slate-400 uppercase mb-2">Response (200 OK)</p>
                            <pre class="bg-slate-900 p-3 rounded-lg text-emerald-400 text-xs overflow-x-auto border border-slate-800"><code>{
  "data": {
    "id": 1,
    "name": "Admin Menanti",
    "email": "admin@menanti.test",
    "role": "admin"
  }
}</code></pre>
                        </div>
                    </div>
                </div>

                <!-- POST /logout & GET /me -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="staff-logout" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-rose-500/20 text-rose-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white">/logout</code>
                        </div>
                        <p class="text-slate-300 text-sm">Menghapus session staf dan token CSRF.</p>
                    </div>
                    <div id="staff-me" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-2.5 py-1 rounded">GET</span>
                            <code class="font-mono text-white">/me</code>
                        </div>
                        <p class="text-slate-300 text-sm">Mendapatkan profil user yang sedang login.</p>
                    </div>
                </div>
            </section>

            <!-- Public Customer API -->
            <section id="public-cart" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Pelanggan (Tanpa Login)</h2>
                    <p class="text-slate-400 text-sm mt-1">Keranjang dikelola lewat cookie <code class="text-amber-300">cart_token</code> secara otomatis.</p>
                </div>

                <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-2.5 py-1 rounded">GET</span>
                        <code class="text-lg font-mono text-white">/api/public/cart</code>
                    </div>
                    <p class="text-slate-300 text-sm">Melihat isi keranjang beserta harga final yang dihitung ulang di server.</p>
                </div>

                <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                        <code class="text-lg font-mono text-white">/api/public/cart/items</code>
                    </div>
                    <p class="text-slate-300 text-sm">Menambahkan produk ke keranjang.</p>
                    <pre class="bg-slate-900 p-3 rounded-lg text-amber-300 text-xs overflow-x-auto border border-slate-800"><code>{
  "product_id": 1,
  "variant_ids": [1, 3],
  "addon_ids": [5],
  "qty": 2,
  "note": "Kurang manis"
}</code></pre>
                </div>

                <div id="public-checkout" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                        <code class="text-lg font-mono text-white">/api/public/checkout</code>
                    </div>
                    <p class="text-slate-300 text-sm">Melakukan checkout pesanan, membuat pesanan <code class="text-amber-300">PENDING_PAYMENT</code>, dan menginisiasi pembayaran Midtrans Snap.</p>
                    <pre class="bg-slate-900 p-3 rounded-lg text-amber-300 text-xs overflow-x-auto border border-slate-800"><code>{
  "customer_name": "Budi Santoso",
  "customer_phone": "081234567890",
  "mode": "takeaway",
  "pickup_note": "Ambil jam 3 sore"
}</code></pre>
                </div>

                <div id="public-order" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-2.5 py-1 rounded">GET</span>
                        <code class="text-lg font-mono text-white">/api/public/orders/{public_token}</code>
                    </div>
                    <p class="text-slate-300 text-sm">Melihat status, rincian item, dan link pembayaran Midtrans pelanggan.</p>
                </div>
            </section>

            <!-- Webhook -->
            <section id="webhook-midtrans" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Webhook Pembayaran</h2>
                </div>
                <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <div class="flex items-center space-x-3">
                        <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                        <code class="text-lg font-mono text-white">/webhooks/payment/midtrans</code>
                    </div>
                    <p class="text-slate-300 text-sm">Menerima notifikasi status pembayaran dari Midtrans. Diverifikasi dengan signature SHA512 dan idempotensi transaksi.</p>
                </div>
            </section>

            <!-- KDS -->
            <section id="kds-orders" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Kitchen Display System (KDS) & Barista</h2>
                    <p class="text-slate-400 text-sm mt-1">Memerlukan autentikasi staf dengan role <code class="text-amber-300">barista</code> atau <code class="text-amber-300">admin</code>.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-2.5 py-1 rounded">GET</span>
                            <code class="font-mono text-white">/kds/orders?status=PAID,PREPARING</code>
                        </div>
                        <p class="text-slate-300 text-sm">Melihat daftar pesanan aktif di KDS.</p>
                    </div>
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white">/kds/orders/{id}/start</code>
                        </div>
                        <p class="text-slate-300 text-sm">Mengubah status pesanan dari <code class="text-amber-300">PAID</code> ke <code class="text-amber-300">PREPARING</code>.</p>
                    </div>
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white">/kds/orders/{id}/ready</code>
                        </div>
                        <p class="text-slate-300 text-sm">Mengubah status pesanan dari <code class="text-amber-300">PREPARING</code> ke <code class="text-amber-300">READY</code>.</p>
                    </div>
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white">/kds/orders/{id}/complete</code>
                        </div>
                        <p class="text-slate-300 text-sm">Menandai pesanan dine-in / takeaway selesai (<code class="text-amber-300">COMPLETED</code>).</p>
                    </div>
                </div>
            </section>

            <!-- Admin -->
            <section id="admin-categories" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Admin Dashboard Endpoints</h2>
                    <p class="text-slate-400 text-sm mt-1">Semua route di bawah <code class="text-amber-300">/admin</code> memerlukan role <code class="text-amber-300">admin</code>.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div id="admin-categories" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Kategori Menu</h3>
                        <p class="text-slate-400 text-xs font-mono">GET/POST /admin/categories</p>
                        <p class="text-slate-400 text-xs font-mono">PUT/DELETE /admin/categories/{id}</p>
                    </div>
                    <div id="admin-products" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Produk & Varian</h3>
                        <p class="text-slate-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/products</p>
                        <p class="text-slate-400 text-xs font-mono">PATCH /admin/products/{id}/sold-out</p>
                        <p class="text-slate-400 text-xs font-mono">POST /admin/products/{id}/image</p>
                    </div>
                    <div id="admin-tables" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Meja & QR Token</h3>
                        <p class="text-slate-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/tables</p>
                        <p class="text-slate-400 text-xs font-mono">POST /admin/tables/{id}/regenerate-token</p>
                    </div>
                    <div id="admin-settings" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Pengaturan Toko</h3>
                        <p class="text-slate-400 text-xs font-mono">GET /admin/store-settings</p>
                        <p class="text-slate-400 text-xs font-mono">PUT /admin/store-settings</p>
                    </div>
                    <div id="admin-delivery" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Zona Delivery</h3>
                        <p class="text-slate-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/delivery-zones</p>
                        <p class="text-slate-400 text-xs font-mono">CRUD aturan fee per zona</p>
                    </div>
                    <div id="admin-reports" class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-2">
                        <h3 class="font-bold text-white">Laporan Ringkasan</h3>
                        <p class="text-slate-400 text-xs font-mono">GET /admin/reports/summary</p>
                        <p class="text-slate-400 text-xs font-mono">Query dengan parameter ?from= & ?to=</p>
                        <p class="text-slate-400 text-xs">Difilter dari <code class="text-amber-300">paid_at</code> (Asia/Jakarta), di-cache 30 menit dan otomatis invalid saat status pesanan berubah.</p>
                    </div>
                </div>
            </section>

            <!-- Real-time -->
            <section id="realtime" class="space-y-6">
                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-2xl font-bold text-white">Real-time (Laravel Reverb)</h2>
                    <p class="text-slate-400 text-sm mt-1">Event dikirim setelah transaksi database commit (<code class="text-amber-300">ShouldDispatchAfterCommit</code>).</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-amber-500/20 text-amber-400 font-mono text-xs font-bold px-2.5 py-1 rounded">PUBLIC</span>
                            <code class="font-mono text-white">order.{public_token}</code>
                        </div>
                        <p class="text-slate-300 text-sm">Channel pelanggan. Berisi status pesanan tanpa data pribadi.</p>
                    </div>
                    <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
                        <div class="flex items-center space-x-3">
                            <span class="bg-rose-500/20 text-rose-400 font-mono text-xs font-bold px-2.5 py-1 rounded">PRIVATE</span>
                            <code class="font-mono text-white">kds.store.{store_id}</code>
                        </div>
                        <p class="text-slate-300 text-sm">Channel KDS. Otorisasi lewat <code class="text-amber-300">/broadcasting/auth</code>; hanya staf aktif (barista/admin).</p>
                    </div>
                </div>

                <div class="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                    <h3 class="font-bold text-white">Event</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-semibold text-slate-400 uppercase mb-2">OrderPaid</p>
                            <pre class="bg-slate-900 p-3 rounded-lg text-emerald-400 text-xs overflow-x-auto border border-slate-800"><code>{
  "order_id": 42,
  "order_number": "MNT-261110-0001",
  "public_token": "...",
  "status": "PAID",
  "paid_at": "2026-11-10T09:30:00+07:00"
}</code></pre>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-slate-400 uppercase mb-2">OrderStatusChanged</p>
                            <pre class="bg-slate-900 p-3 rounded-lg text-emerald-400 text-xs overflow-x-auto border border-slate-800"><code>{
  "order_id": 42,
  "order_number": "MNT-261110-0001",
  "public_token": "...",
  "from_status": "PAID",
  "to_status": "PREPARING",
  "updated_at": "2026-11-10T09:32:00+07:00"
}</code></pre>
                        </div>
                    </div>
                    <p class="text-slate-400 text-sm">Fallback polling: KDS memanggil <code class="text-amber-300">GET /kds/orders</code> tiap 10 detik, pelanggan memanggil <code class="text-amber-300">GET /api/public/orders/{public_token}</code> jika WebSocket gagal.</p>
                </div>
            </section>
        </main>
    </div>
</body>
</html>
