# 02 - Arsitektur Sistem

## 1. Gambaran Umum

```
┌─────────────┐      ┌──────────────────────────────┐      ┌────────────────────┐
│  Pelanggan  │─────▶│  Laravel (Web + API internal) │─────▶│ Supabase PostgreSQL│
│ (tanpa      │      │  - Inertia (Vue/React)        │      └────────────────────┘
│  login)     │      │  - Breeze (admin & barista)   │      ┌────────────────────┐
└─────────────┘      │  - Service layer              │─────▶│ Supabase Storage   │
                     │  - Queue & Scheduler          │      └────────────────────┘
┌─────────────┐      │                              │      ┌────────────────────┐
│ Barista &   │─────▶│                              │◀────▶│ Midtrans / Xendit  │
│ Admin       │      └──────────────┬───────────────┘      │ (webhook)          │
└─────────────┘                     │                      └────────────────────┘
                                    ▼
                          ┌──────────────────────┐      ┌────────────────────┐
                          │ Laravel Reverb       │      │ Google Maps /      │
                          │ (WebSocket)          │      │ Mapbox (geocoding, │
                          └──────────────────────┘      │ jarak)             │
                                                        └────────────────────┘
```

## 2. Komponen

**Laravel (monolith).** Satu aplikasi melayani halaman web (Inertia), endpoint API untuk pelanggan, dan endpoint webhook. Monolith dipilih karena tim kecil dan beban awal rendah.

**Laravel Breeze.** Dipakai hanya untuk autentikasi admin dan barista (email dan password). Tidak dipakai untuk pelanggan.

**Supabase PostgreSQL.** Database utama. Laravel terhubung lewat driver `pgsql` biasa. Supabase Auth tidak dipakai, agar tidak ada dua sistem autentikasi.

**Supabase Storage.** Penyimpanan foto produk. Laravel mengaksesnya lewat disk filesystem S3-compatible (Supabase Storage mendukung protokol S3).

**Payment gateway (Midtrans atau Xendit).** Membuat transaksi pembayaran dan mengirim webhook status. Keputusan gateway ada di `11-DECISIONS.md`.

**Laravel Reverb.** WebSocket server untuk mengirim perubahan status ke layar pelanggan dan KDS. Dipilih agar tetap satu ekosistem Laravel.

**Queue (database driver di awal).** Untuk tugas yang tidak boleh memblokir request: pengiriman notifikasi, pembersihan keranjang, dan pemrosesan webhook.

**Scheduler.** Menjalankan job rutin: mengubah pesanan `PENDING_PAYMENT` yang lewat batas menjadi `EXPIRED`, dan membersihkan keranjang tidak aktif.

**Layanan jarak (Haversine atau Google Distance Matrix).** Dipakai saat checkout delivery untuk menentukan zona. Keputusan ada di `11-DECISIONS.md`.

## 3. Struktur Lapisan

```
HTTP (Controller, Request, Resource)
        │
        ▼
Application Service (CheckoutService, OrderStatusService, PaymentService)
        │
        ▼
Domain (PriceCalculator, DeliveryFeeCalculator, OrderStateMachine, Enum)
        │
        ▼
Persistence (Eloquent Model, Repository bila perlu)
        │
        ▼
PostgreSQL / Supabase
```

Aturan:
- Controller tidak berisi logika bisnis. Controller hanya memvalidasi input, memanggil service, dan mengembalikan response.
- Domain tidak boleh tahu tentang HTTP, session, atau cookie.
- Semua perubahan status pesanan harus lewat `OrderStatusService`.
- Semua perhitungan uang harus lewat `PriceCalculator` atau `DeliveryFeeCalculator`.

## 4. Alur Utama

### 4.1 Pesan dari meja (dine-in)
1. Pelanggan scan QR `/meja/{token}`.
2. Server mencari meja dari token, menyimpan `table_id` dan `mode=dine_in` di session. Keduanya terkunci.
3. Pelanggan menambah item ke keranjang (`cart_token` di cookie).
4. Pelanggan checkout dengan nama dan nomor WhatsApp.
5. `CheckoutService` menghitung ulang harga, membuat `orders` dan `order_items` dalam satu transaksi, status `PENDING_PAYMENT`.
6. `PaymentService` membuat transaksi di gateway, mengembalikan URL atau kode pembayaran.
7. Gateway mengirim webhook ke `/webhooks/payment`.
8. Webhook terverifikasi, status berubah menjadi `PAID`, event `OrderPaid` dikirim ke KDS dan layar pelanggan.

### 4.2 Pesan delivery
1. Pelanggan memilih mode delivery, mengisi data, dan menandai koordinat.
2. Server menghitung jarak dari koordinat toko, menentukan zona, dan menghitung ongkir.
3. Sisanya sama dengan alur dine-in dari langkah 5.

### 4.3 Pesanan kedaluwarsa
1. Saat `PENDING_PAYMENT` dibuat, `expires_at` diisi sesuai `payment_expiry_minutes`.
2. Scheduler memindahkan pesanan lewat batas ke `EXPIRED`.
3. Jika webhook sukses datang setelah `EXPIRED`, sistem tidak mengubah status, mencatat anomali, dan memberi notifikasi ke admin untuk refund manual.

## 5. Real-time

- Channel publik per pesanan: `order.{public_token}`, dipakai layar status pelanggan.
- Channel privat untuk barista: `kds.{store_id}`, hanya bisa diakses user dengan role `barista` atau `admin`.
- Jika koneksi WebSocket gagal, KDS melakukan polling tiap 10 detik ke endpoint antrean.

## 6. Keputusan Teknis yang Sudah Disepakati

- Pelanggan tanpa login. Keranjang memakai token acak di cookie.
- Uang sebagai integer rupiah.
- Timezone `Asia/Jakarta`.
- Ongkir dihitung saat checkout, bukan di halaman keranjang.
- Ambang diskon ongkir per item Rp15.000 (harga final per unit, qty tidak mempengaruhi status kelayakan).
