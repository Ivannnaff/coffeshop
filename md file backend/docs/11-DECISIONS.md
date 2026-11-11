# 11 - Architecture Decision Records (ADR) dan Keputusan Terbuka

## 1. Keputusan yang Sudah Final

### ADR-001: Monolith Laravel
- **Status:** Diterima
- **Keputusan:** Satu aplikasi Laravel untuk web, API, dan webhook.
- **Alasan:** Tim kecil, beban awal rendah, dan ekosistem Laravel sudah mencakup kebutuhan.
- **Konsekuensi:** Pemisahan lewat lapisan service dan domain, bukan lewat microservice.

### ADR-002: Pelanggan Tanpa Login
- **Status:** Diterima
- **Keputusan:** Pelanggan tidak punya akun. Keranjang dikaitkan dengan cookie token, dan status pesanan lewat `public_token`.
- **Alasan:** Mengurangi gesekan di dine-in, yang menjadi prioritas utama.
- **Konsekuensi:** Riwayat tidak lintas perangkat. Fitur Pesan Lagi hanya dari halaman status. Risiko spam pesanan dimitigasi dengan rate limit per nomor WhatsApp.

### ADR-003: Breeze Hanya untuk Admin dan Barista
- **Status:** Diterima
- **Keputusan:** Breeze dipakai untuk autentikasi staf. Tidak ada tabel `customers` atau login pelanggan.
- **Alasan:** Menghindari dua sistem autentikasi dan mengurangi scope MVP.
- **Konsekuensi:** Kolom `role` sederhana. Spatie Permission ditunda sampai peran bertambah.

### ADR-004: Supabase untuk PostgreSQL dan Storage, Bukan Auth
- **Status:** Diterima
- **Keputusan:** Laravel terhubung ke Supabase PostgreSQL dan Storage. Supabase Auth tidak dipakai.
- **Alasan:** Autentikasi sudah ditangani Breeze. Menghindari konflik dua sistem identitas.
- **Konsekuensi:** Akses data hanya lewat Laravel. Service role key hanya di server.

### ADR-005: Uang sebagai Integer Rupiah
- **Status:** Diterima
- **Keputusan:** Semua nilai uang disimpan sebagai `bigInteger` dalam rupiah utuh.
- **Alasan:** Rupiah tidak punya sen. Menghindari masalah pembulatan `float`.
- **Konsekuensi:** Persentase diskon dihitung dengan pembulatan ke bawah, dan aturan pembulatan didokumentasikan.

### ADR-006: Harga Dihitung di Server dengan Snapshot
- **Status:** Diterima
- **Keputusan:** Client tidak mengirim harga. Pesanan menyimpan snapshot nama, harga, varian, dan add-on.
- **Alasan:** Mencegah manipulasi harga dan menjaga riwayat tetap akurat saat menu berubah.
- **Konsekuensi:** Tabel pesanan sedikit lebih besar, tetapi audit lebih mudah.

### ADR-007: Status Pesanan Tanpa Batal dan Refund
- **Status:** Diterima (dapat ditinjau setelah operasional berjalan)
- **Keputusan:** Status akhir hanya `COMPLETED` dan `EXPIRED`. Tidak ada status batal atau refund di sistem.
- **Alasan:** Kesederhanaan MVP sesuai keputusan pemilik produk.
- **Konsekuensi:** Refund dilakukan manual lewat dashboard gateway, dan kasus `late_after_expired` ditangani admin.

### ADR-008: Ambang Diskon Ongkir Per Item Rp15.000
- **Status:** Diterima
- **Keputusan:** Item dihitung untuk diskon ongkir jika harga final per unit ≥ `delivery_min_item_price`. Qty tidak mempengaruhi kelayakan.
- **Alasan:** Mencegah pesanan dipecah menjadi banyak item kecil untuk mendapat diskon.
- **Konsekuensi:** Pelanggan yang memesan 2 item Rp14.000 tidak mendapat diskon. Harus dijelaskan di UI.

### ADR-009: Ongkir Berbasis Zona
- **Status:** Diterima
- **Keputusan:** Ongkir ditentukan dari zona jarak. Diskon mengikuti aturan zona.
- **Alasan:** Lebih mudah dijelaskan ke pelanggan dan lebih murah daripada tarif per km yang dihitung dinamis.
- **Konsekuensi:** Perlu tabel `delivery_zones` dan `delivery_fee_rules`.

### ADR-010: Expired Pembayaran 15 Menit
- **Status:** Diterima
- **Keputusan:** Pesanan `PENDING_PAYMENT` menjadi `EXPIRED` setelah 15 menit, dan durasi yang sama dikirim ke gateway.
- **Alasan:** Membebaskan slot pesanan dan mengurangi spam.
- **Konsekuensi:** Pembayaran yang masuk setelah expired ditangani sebagai `late_after_expired`.

### ADR-011: Timezone Asia/Jakarta
- **Status:** Diterima
- **Keputusan:** Seluruh aplikasi, database query laporan, dan tampilan memakai `Asia/Jakarta`.
- **Alasan:** Operasional kafe di Indonesia dan laporan harian harus akurat.

### ADR-012: Midtrans sebagai Payment Gateway
- **Status:** Diterima
- **Keputusan:** Midtrans Snap dipakai untuk pembuatan transaksi pembayaran dan webhook status.
- **Alasan:** Mendukung QRIS, e-wallet, dan Virtual Account dengan dokumentasi yang lengkap untuk pasar Indonesia.
- **Konsekuensi:** Signature webhook diverifikasi dengan `SHA512(order_id + status_code + gross_amount + ServerKey)`. Transaksi sandbox memerlukan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY`.

### ADR-013: Laravel Reverb untuk Real-time
- **Status:** Diterima
- **Keputusan:** Laravel Reverb menjadi server WebSocket, dengan event `OrderPaid` dan `OrderStatusChanged` yang di-dispatch setelah commit.
- **Alasan:** Satu ekosistem Laravel, tidak perlu layanan pihak ketiga, dan mendukung channel publik pelanggan serta channel privat KDS.
- **Konsekuensi:** Produksi membutuhkan proses `php artisan reverb:start` dan `php artisan queue:work`. Jika WebSocket gagal, klien memakai fallback polling ke endpoint status/KDS.

## 2. Keputusan yang Masih Terbuka

| No | Keputusan | Pilihan | Dibutuhkan sebelum | Catatan |
|----|-----------|---------|--------------------|---------|
| T-1 | Payment gateway | ~~Midtrans atau Xendit~~ Midtrans (lihat ADR-012) | Fase 5 | Sudah diputuskan: Midtrans Snap. |
| T-2 | Penyedia jarak | Haversine (garis lurus) atau Google Distance Matrix | Fase 4 | Haversine murah tapi tidak mencerminkan jalan. Distance Matrix akurat tapi berbayar per request. |
| T-3 | Peta frontend | Google Maps atau Mapbox | Fase frontend | Bandingkan kuota gratis dan biaya Maps JavaScript dan Geocoding |
| T-4 | Pajak dan service charge | Harga sudah termasuk pajak atau belum | Fase 3 | Mempengaruhi perhitungan total |
| T-5 | Mesin promo | Persentase, nominal, atau BOGO | Fase 3 | Jika belum ada, promo hanya berupa `badge` dan harga manual |
| T-6 | Notifikasi | WhatsApp, email, atau hanya halaman status | Fase 8 | Nomor WhatsApp sudah dikumpulkan |
| T-7 | Kebijakan retensi data | Berapa lama data pesanan disimpan | Fase 9 | Terkait UU Pelindungan Data Pribadi |
| T-8 | Multi-outlet | Satu cabang atau banyak | Fase 1 | Desain saat ini sudah menyiapkan `store_id` |
| T-9 | Batas gratis ongkir per zona | Berlaku untuk semua zona atau zona tertentu | Fase 4 | Disarankan zona 1 dan 2 saja |
| T-10 | Metode delivery | Kurir internal atau pihak ketiga | Fase 4 | Mempengaruhi status `OUT_FOR_DELIVERY` |

## 3. Cara Menambah Keputusan Baru

1. Buat entri baru dengan nomor ADR berikutnya.
2. Isi status, keputusan, alasan, dan konsekuensi.
3. Perbarui dokumen terkait (`03`, `04`, `05`, `06`).
4. Tandai keputusan yang digantikan sebagai "Digantikan oleh ADR-xxx", jangan dihapus.
