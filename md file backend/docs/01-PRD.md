# 01 - Product Requirements Document (PRD)

## 1. Ringkasan

Menanti adalah website coffee shop yang melayani pemesanan dine-in (lewat QR meja), takeaway, dan delivery. Pelanggan memesan tanpa login, lalu membayar secara otomatis lewat payment gateway. Barista menyiapkan pesanan lewat Kitchen Display System (KDS), dan admin mengelola menu, meja, zona delivery, dan laporan.

## 2. Tujuan

- Mempercepat proses pemesanan di kafe, terutama untuk dine-in.
- Menghilangkan konfirmasi pembayaran manual (tanpa upload bukti transfer).
- Mengurangi kesalahan pesanan dengan KDS dan instruksi kustomisasi yang jelas.
- Memberi admin gambaran penjualan harian dan bulanan tanpa perhitungan manual.

## 3. Pengguna

| Peran | Akses | Login |
|-------|-------|-------|
| Pelanggan (tamu) | Lihat menu, keranjang, checkout, lacak pesanan | Tidak |
| Barista | KDS: lihat antrean, ubah status PREPARING dan READY | Ya (role `barista`) |
| Admin | Semua fitur barista, ditambah CRUD menu, meja, zona delivery, laporan | Ya (role `admin`) |

## 4. Mode Pemesanan

- **Dine-in:** pelanggan scan QR di meja, nomor meja terisi otomatis dari token. Pelanggan mengambil pesanan sendiri di counter.
- **Takeaway:** pelanggan memilih mode di halaman utama, mengambil sendiri di counter.
- **Delivery:** pelanggan mengisi alamat dan menandai lokasi di peta. Ongkir dihitung berdasarkan zona.

## 5. Fitur Utama (MVP)

**Pelanggan**
- Katalog menu dengan kategori, pencarian nama, badge (Promo, Best Seller, Sold Out).
- Varian ukuran (Regular, Large) dan suhu (Hot, Iced) yang memengaruhi harga.
- Add-on berbayar dan gratis, dikelompokkan per grup dengan aturan pilih.
- Keranjang yang bertahan selama sesi dan kedaluwarsa otomatis.
- Checkout dengan nama dan nomor WhatsApp, plus alamat untuk delivery.
- Pembayaran via QRIS, e-wallet, atau Virtual Account (Midtrans atau Xendit).
- Halaman status pesanan dengan link unik, dan tombol "Pesan Lagi".

**Barista dan Admin**
- KDS dengan antrean pesanan `PAID`, detail kustomisasi, dan tombol update status.
- CRUD kategori, produk, varian, grup add-on, dan add-on.
- Upload foto produk ke Supabase Storage.
- Toggle Sold Out per produk.
- CRUD meja dan regenerasi token QR.
- Pengaturan toko: jam operasional, ambang harga ongkir gratis, durasi expired.
- CRUD zona delivery dan aturan ongkir.
- Laporan penjualan: total pendapatan, jumlah item terjual, dan 5 produk terlaris.

## 6. Di Luar Scope MVP

- Login pelanggan, profil, dan riwayat pesanan lintas perangkat.
- Loyalty point dan promo khusus pelanggan.
- Penggabungan beberapa pesanan dalam satu pengiriman (batching).
- Inventaris bahan baku.
- Multi-outlet (desain database tetap menyiapkan `store_id`, tetapi belum diimplementasikan).
- Refund dan pembatalan pesanan otomatis.
- Pajak dan service charge (menunggu keputusan).

## 7. Kebutuhan Non-Fungsional

- **Keamanan:** harga dihitung di server, webhook terverifikasi, akses admin dibatasi.
- **Keandalan:** pesanan dan pembayaran konsisten walau webhook datang lebih dari sekali.
- **Kinerja:** halaman menu memuat dalam 2 detik pada koneksi 4G. Respon API untuk checkout di bawah 1 detik tanpa menghitung ongkir eksternal.
- **Ketersediaan:** kasir dan KDS tetap bisa dipakai saat koneksi real-time terputus (fallback polling).
- **Audit:** perubahan status dan harga tercatat.

## 8. Metrik Keberhasilan

- Pesanan dine-in dari scan QR sampai pembayaran selesai rata-rata di bawah 2 menit.
- Tidak ada pesanan `PAID` tanpa pembayaran yang tercatat di tabel `payments`.
- Tidak ada selisih antara total yang dibayar dan total yang tercatat di `orders`.
- Laporan harian sesuai dengan total pesanan berstatus `PAID` ke atas.
