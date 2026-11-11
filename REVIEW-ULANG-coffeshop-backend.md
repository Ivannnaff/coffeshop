# Review Ulang: coffeshop (commit e078b8c)

Review statis terhadap commit `e078b8c` ("fix all 14 backend bugs and implement missing public endpoints"). PHP dan Composer tidak tersedia di sandbox, sehingga test tidak dijalankan ulang.

## Status Bug Sebelumnya

| ID | Judul | Status | Catatan |
|----|-------|--------|---------|
| B-01 | Webhook pending lalu settlement dianggap duplikat | Diperbaiki | Kunci idempotensi sekarang `transaction_id:status` |
| B-02 | Keranjang error jika produk sold out | Diperbaiki, tetapi memunculkan R-01 | Tampilan keranjang sudah longgar, checkout ikut terdampak |
| B-03 | Varian ganda per tipe | Diperbaiki | Validasi di Form Request dan `PriceCalculator` |
| B-04 | Pembayaran gagal membuat pesanan tidak bisa dilanjutkan | Belum diperbaiki | `CheckoutController` tidak berubah. Endpoint retry sudah ditulis tetapi belum terdaftar, dan memerlukan token yang tidak dikembalikan saat gagal |
| B-05 | Nomor pesanan bentrok | Belum diperbaiki | `generateOrderNumber` masih `count() + 1` |
| B-06 | KDS tidak punya nama dan alamat | Diperbaiki sebagian, memunculkan R-03 | Field sudah ada, tetapi juga muncul di endpoint publik |
| B-07 | Optimistic lock KDS tidak aktif | Diperbaiki | `version` sudah dikirim dari `OrderResource` |
| B-08 | Hapus kategori menghasilkan 500 | Diperbaiki | Dicek dulu, dikembalikan 422 |
| B-09 | Expired tidak sinkron dengan Midtrans | Belum diperbaiki | `CheckoutService` tidak berubah |
| B-10 | Pesan error konfigurasi toko salah | Belum diperbaiki | `StoreClosedException` masih dipakai |
| B-11 | Batas pesanan aktif bisa terlewati | Belum diperbaiki | Pengecekan masih di luar lock |
| B-12 | Webhook tanpa rate limit | Belum diperbaiki | Tidak ada throttle di route webhook |
| B-13 | `/api-docs` terbuka di production | Diperbaiki | Mengembalikan 404 di production |
| B-14 | Upload memuat seluruh file ke memori | Diperbaiki | Memakai stream |

Ringkasan: 8 diperbaiki, 1 diperbaiki sebagian, 5 belum diperbaiki (B-04, B-05, B-09, B-10, B-11, B-12).

## Bug Baru dan Regresi

### R-01 (Kritis): Checkout tidak lagi memblokir item yang sold out
**Lokasi:** `CheckoutService::pricedCart` (baris 161) memanggil `cartService->calculate()`. Method ini sekarang memakai `calculateDisplay`, yang longgar, dan item tidak tersedia diberi `lineTotal = 0`, lalu dikecualikan dari subtotal.

**Dampak:**
- Checkout menyimpan item yang sold out dengan `unit_price = 0` dan `line_total = 0`, tanpa error.
- Pelanggan membayar tanpa item tersebut, tetapi pesanan tetap dibuat seolah-olah berhasil.
- Jika semua item tidak tersedia, total menjadi 0. Gateway akan menolak transaksi dengan nominal 0, lalu pesanan tertinggal sebagai `PENDING_PAYMENT`.
- `CheckoutService::preview` juga terdampak, sehingga pelanggan melihat total yang salah.

**Perbaikan:** Di `CheckoutService::pricedCart` ganti pemanggilan menjadi `cartService->calculateStrict($cart)`. Tambahkan juga pengecekan: jika ada item `is_available = false`, lempar `PRODUCT_UNAVAILABLE` sebelum membuat pesanan.

**Uji:** Tandai produk sold out setelah masuk keranjang, lalu checkout. Respons harus 422 `PRODUCT_UNAVAILABLE`, dan tidak ada baris baru di `orders`.

### R-02 (Tinggi): Endpoint baru tidak terdaftar di route
**Lokasi:** `routes/api.php` dan `routes/web.php` tidak berubah. Controller `MenuController`, `TableModeController`, serta method `reorder` dan `retryPayment` di `OrderController` sudah ada, tetapi tidak ada route yang menunjuk ke sana.

**Dampak:** `GET /api/public/menu`, `GET /api/public/menu/search`, `GET /meja/{qr_token}`, `POST /mode`, `POST /api/public/orders/{token}/reorder`, dan `POST /api/public/orders/{token}/payment` tetap 404. Pesan commit "implement missing public endpoints" tidak sesuai dengan kode.

**Perbaikan:** Daftarkan semua route, dan tambahkan konfigurasi `menanti.menu_url` di `config/menanti.php` jika memang dipakai di `TableModeController`.

### R-03 (Sedang): Endpoint publik sekarang membuka nama dan alamat pelanggan
**Lokasi:** `OrderResource` dipakai juga oleh `GET /api/public/orders/{token}`.

**Masalah:** Setiap pemegang `public_token` sekarang melihat `customer_name`, `delivery_address`, `delivery_latitude`, dan `delivery_longitude`. Token dibagikan lewat link, dan bisa terekspos di riwayat browser atau chat.

**Perbaikan:** Buat `StaffOrderResource` untuk KDS dan admin yang memuat data lengkap. `OrderResource` publik hanya memuat data status, item, dan total. Nama pelanggan boleh ditampilkan sebagai inisial saja, misalnya "B***".

### R-04 (Rendah): Data keranjang lama bisa membuat tampilan keranjang error
**Lokasi:** `PriceCalculator::computePricedItem` melempar `InvalidArgumentException` jika ada dua varian dengan tipe yang sama. `calculateItemDisplay` memanggil method ini tanpa `try`.

**Dampak:** Keranjang yang dibuat sebelum validasi B-03 masih bisa berisi dua varian tipe sama, dan `GET /cart` akan 500.

**Perbaikan:** Di `calculateItemDisplay`, tangkap `InvalidArgumentException` dan kembalikan item dengan `unavailable_reason`.

## Belum Terverifikasi

- Commit mengklaim "100% test pass rate" dan "PHPStan level 6 bersih". Tidak ada test untuk menu, meja, mode, reorder, dan retry pembayaran di folder `tests/Feature`, sehingga klaim ini tidak bisa diverifikasi dari kode. Tolong jalankan `php artisan test` dan `phpstan analyse`, lalu kirim hasilnya.
- Test untuk R-01 belum ada, dan regresi ini lolos karena tidak ada test yang menguji checkout dengan item sold out.
- Dokumen `BUGS-coffeshop-backend.md` sudah ikut di-commit ke `md file backend/`.

## Urutan Perbaikan yang Disarankan

1. R-01: ganti ke `calculateStrict` di checkout dan preview. Ini regresi yang bisa membuat pelanggan membayar salah.
2. R-02: daftarkan route baru.
3. B-04 dan B-05: perbaiki respons 502 dan nomor pesanan.
4. B-09, B-10, B-11, B-12.
5. R-03 dan R-04.
6. Tambahkan test untuk setiap bug di atas, termasuk R-01.
