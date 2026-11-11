# 10 - Roadmap Backend

Urutan ini dibuat dari fondasi ke fitur. Setiap fase punya kriteria selesai (Definition of Done). Fase berikutnya tidak dimulai sebelum fase sebelumnya lulus test.

## Fase 0: Setup Proyek
**Tujuan:** Proyek bisa dijalankan, terhubung ke database, dan login admin berfungsi.
- Instal Laravel dan Breeze (versi sesuai keputusan frontend).
- Konfigurasi PostgreSQL (Supabase dan Docker lokal).
- Set timezone `Asia/Jakarta`.
- Tambah kolom `role` dan `is_active` di `users`.
- Setup Pint, PHPStan, Pest, dan CI.

**Selesai jika:** `php artisan migrate` sukses, login admin berjalan, CI hijau.

## Fase 1: Skema Database
**Tujuan:** Semua tabel dari `03-DATABASE.md` terbentuk dengan index dan constraint.
- Migrasi katalog, operasional, delivery, keranjang, pesanan, pembayaran, dan log.
- Seeder data demo.
- Factory untuk setiap model.

**Selesai jika:** Migrasi bisa `rollback` dan `migrate` ulang tanpa error, foreign key dan index unik sudah diverifikasi.

## Fase 2: Domain Inti
**Tujuan:** Aturan status dan model domain berdiri sendiri dan teruji.
- Enum `OrderStatus` dan `OrderStateMachine`.
- `OrderStatusService` dengan pencatatan log.
- Exception domain.

**Selesai jika:** Semua kasus uji state machine di `08-TESTING.md` lulus.

## Fase 3: Mesin Harga
**Tujuan:** Harga, varian, add-on, dan kelayakan ongkir dihitung dengan benar.
- `PriceCalculator` dan DTO hasil.
- Validasi add-on (`min_select`, `max_select`, `single`).
- Logika `is_delivery_eligible`.

**Selesai jika:** Seluruh kasus uji harga di `08-TESTING.md` lulus dengan cakupan Domain minimal 90%.

## Fase 4: Keranjang, Ongkir, dan Checkout
**Tujuan:** Pelanggan bisa membuat pesanan dine-in, takeaway, dan delivery.
- `CartService` dengan cookie token dan pembersihan keranjang.
- `DeliveryZoneResolver` dan `DeliveryFeeCalculator`.
- Endpoint checkout preview dan checkout.
- `CheckoutService` dalam satu transaksi, dengan snapshot lengkap.
- Rate limit checkout.
- Job `ExpireUnpaidOrdersJob` dan scheduler.

**Selesai jika:** Alur dine-in, takeaway, dan delivery menghasilkan pesanan `PENDING_PAYMENT` yang benar, dan pesanan expired berubah status otomatis.

*Prasyarat keputusan: penyedia jarak (lihat `11-DECISIONS.md`).*

## Fase 5: Pembayaran
**Tujuan:** Pembayaran otomatis dengan webhook yang aman.
- Interface `PaymentGateway` dan implementasi gateway pilihan.
- Pembuatan transaksi saat checkout.
- Endpoint webhook dengan verifikasi signature, idempotensi, dan lock.
- Penanganan `late_after_expired`.
- Notifikasi admin untuk anomali.

**Selesai jika:** Semua kasus uji webhook lulus, dan transaksi sandbox end-to-end berhasil.

*Prasyarat keputusan: gateway pembayaran (lihat `11-DECISIONS.md`).*

## Fase 6: KDS dan Admin
**Tujuan:** Barista bisa mengelola pesanan, admin bisa mengelola katalog.
- Endpoint KDS dan transisi status.
- Middleware role dan policy.
- CRUD kategori, produk, varian, grup add-on, add-on, meja, dan zona delivery.
- Upload foto ke Supabase Storage.
- Toggle sold out dan pengaturan toko.

**Selesai jika:** Barista hanya bisa mengakses KDS, admin bisa mengakses seluruh admin, dan uji keamanan di `08-TESTING.md` lulus.

## Fase 7: Laporan
**Tujuan:** Admin melihat penjualan ringkas.
- Query ringkasan dengan filter tanggal dan zona waktu.
- Top produk.
- Cache statistik harian dengan invalidasi.

**Selesai jika:** Angka laporan sama dengan jumlah manual dari data uji, dan query bulanan di bawah 1 detik dengan data besar.

## Fase 8: Real-time
**Tujuan:** Layar pelanggan dan KDS diperbarui otomatis.
- Event `OrderPaid`, `OrderStatusChanged` dengan `ShouldDispatchAfterCommit`.
- Channel publik per pesanan dan channel privat KDS.
- Konfigurasi Reverb dan fallback polling.

**Selesai jika:** Perubahan status tampil di layar pelanggan dan KDS dalam dua detik pada koneksi normal.

## Fase 9: Hardening dan Go-Live
- Review keamanan lengkap sesuai `06-SECURITY.md`.
- Load test checkout dan KDS.
- Monitoring, alert, dan backup terverifikasi.
- Checklist go-live di `09-ENVIRONMENT.md`.

## Di Luar Fase MVP (Fase 2 Produk)
- Pelanggan login dan riwayat lintas perangkat.
- Loyalty dan promo khusus pelanggan.
- Batching pengiriman.
- Inventaris bahan baku.
- Multi-outlet penuh.
- Refund otomatis.
