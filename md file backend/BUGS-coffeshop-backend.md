# Daftar Bug Backend: coffeshop (Project Laravel Menanti)

Review dilakukan secara statis terhadap repo `Ivannnaff/coffeshop`. PHP dan Composer tidak tersedia di sandbox, jadi test belum dijalankan. Semua temuan perlu dikonfirmasi dengan `php artisan test` dan reproduksi manual.

## Ringkasan

| ID | Tingkat | Judul | File utama |
|----|---------|-------|------------|
| B-01 | Kritis | Webhook pending lalu settlement dianggap duplikat, pesanan tidak pernah PAID | `PaymentService.php`, migrasi `webhook_events` |
| B-02 | Kritis | Keranjang error total jika ada produk atau add-on yang sold out atau dihapus | `CartService.php`, `CartItemMapper.php`, `PriceCalculator.php` |
| B-03 | Kritis | Varian bisa dipilih lebih dari satu per tipe, harga bisa salah | `AddCartItemRequest.php`, `PriceCalculator.php` |
| B-04 | Tinggi | Pembayaran gagal setelah pesanan dibuat, keranjang sudah terhapus | `CheckoutController.php` |
| B-05 | Tinggi | Nomor pesanan bentrok saat checkout bersamaan, menghasilkan 500 | `CheckoutService.php` |
| B-06 | Tinggi | KDS dan admin tidak mendapat nama pelanggan dan alamat delivery | `OrderResource.php` |
| B-07 | Sedang | Optimistic lock KDS tidak pernah aktif karena `version` tidak dikirim | `OrderResource.php`, `KdsOrderController.php` |
| B-08 | Sedang | Hapus kategori yang masih punya produk menghasilkan 500 | `CategoryController.php` |
| B-09 | Sedang | Expired pesanan dan expired Midtrans tidak sinkron, sering terjadi late_after_expired | `CheckoutService.php`, `MidtransGateway.php` |
| B-10 | Sedang | Pesan error "toko tutup" dipakai untuk konfigurasi toko yang belum lengkap | `CheckoutService.php` |
| B-11 | Rendah | Batas pesanan aktif per nomor WhatsApp bisa terlewati karena race | `CheckoutService.php` |
| B-12 | Rendah | Webhook tidak punya rate limit, event invalid bisa membanjiri database | `PaymentService.php`, `routes` |
| B-13 | Rendah | `/api-docs` terbuka di production | `routes/web.php`, `resources/views/api-docs.blade.php` |
| B-14 | Rendah | Upload foto memuat seluruh file ke memori | `ProductImageController.php` |

---

## B-01 (Kritis): Pembayaran pending lalu settlement dianggap duplikat

**Lokasi:** `app/Services/PaymentService.php`, method `processWebhook`, dan tabel `webhook_events` (unique `gateway, event_id`).

**Masalah:** `event_id` diisi dengan `transaction_id`. Midtrans mengirim beberapa notifikasi untuk satu transaksi, misalnya `pending` lalu `settlement`, dan `transaction_id` tetap sama. Notifikasi pertama membuat baris `webhook_events`. Notifikasi kedua gagal insert karena unique constraint, lalu dikembalikan sebagai `Duplicate` tanpa diproses.

**Dampak:** Pelanggan sudah membayar, tetapi pesanan tetap `PENDING_PAYMENT` sampai expired. Untuk QRIS dan e-wallet, ini hampir pasti terjadi.

**Perbaikan:**
```php
$status = (string) ($notification->rawPayload['transaction_status'] ?? '');
$eventId = $notification->transactionId.':'.$status;
```

**Uji:** Kirim dua payload dengan `transaction_id` sama, status `pending` lalu `settlement`. Pesanan harus berubah ke `PAID`.

---

## B-02 (Kritis): Keranjang error total jika ada produk atau add-on sold out atau dihapus

**Lokasi:** `CartService::calculate` memanggil `PriceCalculator::calculate`. Di dalamnya, `calculateItem` melempar `ProductUnavailableException` jika `isActive = false` atau `isSoldOut = true`. `CartItemMapper::toInput` juga melempar jika produk sudah soft-deleted (`$item->product === null`).

**Masalah:** Keranjang dihitung ulang setiap kali ditampilkan. Satu item yang tidak tersedia membuat seluruh respons keranjang gagal, termasuk `GET /api/public/cart`.

**Dampak:**
- Pelanggan tidak bisa melihat keranjangnya sama sekali.
- `DELETE /api/public/cart/items/{id}` menghapus item lebih dulu, lalu mengembalikan error karena `cartResponse` juga memanggil `calculate`. Pelanggan melihat error walaupun itemnya sudah hilang.
- Admin yang menandai produk Sold Out bisa membuat keranjang pelanggan rusak.

**Perbaikan:** Pisahkan dua hal. Untuk tampilan keranjang, kembalikan item dengan flag `is_available = false` dan alasannya, tanpa melempar exception. Untuk checkout, tetap blokir dengan `PRODUCT_UNAVAILABLE`. Mapper juga harus menandai produk yang sudah dihapus sebagai tidak tersedia, bukan melempar error.

**Uji:** Tandai produk sold out setelah masuk keranjang. `GET /cart` harus 200 dengan item bertanda tidak tersedia. `POST /checkout` harus menolak dengan `PRODUCT_UNAVAILABLE`.

---

## B-03 (Kritis): Varian bisa dipilih lebih dari satu per tipe

**Lokasi:** `AddCartItemRequest::rules` hanya mengecek bahwa setiap `variant_ids` ada di produk. `PriceCalculator::calculateItem` menjumlahkan semua `price_delta` tanpa memeriksa tipe.

**Masalah:** Client bisa mengirim dua ID varian ukuran atau dua ID suhu. Delta dijumlahkan, dan `sizeName` diambil dari varian terakhir. Jika ada varian dengan delta negatif, harga bisa lebih murah dari seharusnya.

**Contoh:** Produk punya Regular (0), Large (+3.000), dan Small (-2.000). Kirim Small dan Large sekaligus, total delta menjadi +1.000. Kirim Small dua kali, delta menjadi -4.000.

**Perbaikan:**
- Validasi di Form Request: maksimal satu varian per tipe. Untuk produk yang punya ukuran atau suhu, wajib salah satu.
- Validasi ulang di `PriceCalculator`: tolak jika ada tipe yang muncul lebih dari sekali.
- Pastikan varian duplikat (ID sama) juga ditolak.

**Uji:** Kirim dua ukuran, dua suhu, dan ID varian yang sama dua kali. Semuanya harus ditolak. Kirim tanpa ukuran wajib harus ditolak.

---

## B-04 (Tinggi): Pembayaran gagal setelah pesanan dibuat

**Lokasi:** `CheckoutController::store`.

**Masalah:** `checkoutService->checkout` sudah commit pesanan dan menghapus keranjang. Setelah itu `paymentService->initiatePayment` dipanggil. Jika gateway gagal (timeout, kunci salah, dll.), exception `PaymentGatewayException` dikembalikan sebagai 502. Respons ini tidak berisi `public_token` atau `order_number`.

**Dampak:**
- Keranjang pelanggan hilang.
- Pelanggan tidak punya cara untuk melanjutkan pembayaran, karena tidak punya token pesanan.
- Pesanan `PENDING_PAYMENT` tetap tersimpan, lalu expired diam-diam. Ada data sampah dan pelanggan tidak tahu.

**Perbaikan:**
- Kembalikan `public_token`, `order_number`, dan `payment: null` bersama status `payment_failed` walaupun gateway gagal.
- Tambahkan endpoint `POST /api/public/orders/{token}/payment` untuk mencoba ulang pembuatan transaksi.
- Pertimbangkan menghapus keranjang setelah pembayaran berhasil dibuat, bukan sebelumnya.

**Uji:** Matikan koneksi gateway lalu checkout. Respons harus memuat token pesanan, dan pembayaran bisa dicoba ulang.

---

## B-05 (Tinggi): Nomor pesanan bentrok saat checkout bersamaan

**Lokasi:** `CheckoutService::generateOrderNumber`.

**Masalah:** Nomor dibuat dengan `count() + 1` untuk hari yang sama. Dua checkout di waktu bersamaan bisa membaca count yang sama. Kolom `order_number` unique, jadi insert kedua gagal dengan `UniqueConstraintViolationException` dan menjadi 500.

**Juga:** Jika ada pesanan yang dihapus, nomor berikutnya bisa bentrok dengan nomor yang sudah dipakai.

**Perbaikan:** Gunakan sequence harian dari tabel khusus dengan `lockForUpdate()`, atau gunakan sequence PostgreSQL per hari. Alternatif yang lebih sederhana: retry saat unique violation, dengan maksimal tiga percobaan.

**Uji:** Jalankan 20 checkout paralel. Semua harus berhasil dengan nomor unik.

---

## B-06 (Tinggi): KDS dan admin tidak mendapat nama pelanggan dan alamat delivery

**Lokasi:** `app/Http/Resources/OrderResource.php`.

**Masalah:** Resource ini dipakai untuk KDS, halaman status publik, dan respons checkout. Field `customer_name`, `delivery_address`, `delivery_latitude`, `delivery_longitude`, `delivery_distance_km`, dan `delivery_zone_name` tidak disertakan.

**Dampak:**
- Barista tidak bisa memanggil nama pelanggan untuk takeaway.
- Kurir tidak punya alamat tujuan di KDS.
- Hanya nomor meja yang tampil untuk dine-in.

**Perbaikan:** Buat `StaffOrderResource` untuk KDS dan admin yang menyertakan nama dan alamat. `OrderResource` publik hanya memuat data yang aman, dan nomor WhatsApp tidak ikut. Jika pelanggan perlu memverifikasi pesanan, cukup `order_number` dan total.

**Uji:** Respons KDS harus memuat `customer_name` dan alamat delivery. Respons publik tidak boleh memuat `customer_phone`.

---

## B-07 (Sedang): Optimistic lock KDS tidak pernah aktif

**Lokasi:** `KdsOrderController::transition` memeriksa `version`, tetapi `OrderResource` tidak mengembalikan field `version`.

**Masalah:** Frontend tidak punya nilai `version` untuk dikirim, jadi `$version` selalu 0 dan pengecekan dilewati. Dua barista bisa menekan tombol yang sama pada pesanan yang sama tanpa deteksi konflik.

**Catatan:** State machine tetap melindungi dari transisi tidak valid, jadi kerusakannya terbatas pada pesan yang membingungkan dan kemungkinan status tertimpa oleh aksi yang valid tetapi sudah usang.

**Perbaikan:** Tambahkan `version` ke resource KDS, dengan nilai `updated_at` dalam milidetik. Pastikan nilainya sama dengan yang dibandingkan di controller.

**Uji:** Dua request dengan versi lama, request kedua harus 409 `STALE_ORDER`.

---

## B-08 (Sedang): Hapus kategori yang masih punya produk menghasilkan 500

**Lokasi:** `CategoryController::destroy`. Foreign key `products.category_id` menggunakan `restrictOnDelete()`.

**Masalah:** `$category->delete()` melempar `QueryException` saat kategori masih punya produk, dan bootstrap tidak memetakannya. Admin mendapat 500.

**Perbaikan:** Cek jumlah produk terlebih dahulu, lalu kembalikan 422 dengan pesan "Kategori masih memiliki produk. Pindahkan atau hapus produk terlebih dahulu."

**Uji:** Hapus kategori yang punya produk harus 422. Hapus kategori kosong harus 204.

---

## B-09 (Sedang): Expired pesanan tidak sinkron dengan expired Midtrans

**Lokasi:** `CheckoutService::checkout` menghitung `expires_at` sebelum transaksi dibuat di gateway. `MidtransGateway::createTransaction` mengirim `expiry.duration` setelah itu.

**Masalah:** Waktu expired Midtrans dimulai dari saat transaksi dibuat, yang sedikit lebih lambat dari `expires_at` kita. Pelanggan yang membayar di celah beberapa detik bisa mendapat `late_after_expired`.

**Dampak:** Admin harus refund manual lebih sering dari yang seharusnya.

**Perbaikan:** Beri grace period, misalnya satu menit, antara `expires_at` lokal dan batas yang dikirim ke gateway. Atau hitung ulang `expires_at` dari waktu respons gateway. Catat juga angka ini di dokumen.

---

## B-10 (Sedang): Pesan error konfigurasi toko membingungkan

**Lokasi:** `CheckoutService::deliveryQuote`. Jika `store_settings` tidak punya koordinat, kode melempar `StoreClosedException` dengan pesan "toko tutup".

**Masalah:** Pelanggan melihat pesan toko tutup padahal masalahnya konfigurasi. Admin juga tidak tahu harus memperbaiki apa.

**Perbaikan:** Buat `StoreConfigurationException` terpisah. Log sebagai error, dan kembalikan 503 dengan pesan generik untuk pelanggan.

Catatan terkait: `StoreSettingsService::get()` melempar `RuntimeException` jika tabel kosong, yang menjadi 500 generik. Sebaiknya dipetakan juga.

---

## B-11 (Rendah): Batas pesanan aktif bisa terlewati

**Lokasi:** `CheckoutService::assertActiveOrderLimit` dicek sebelum transaksi dan sebelum lock.

**Masalah:** Dua checkout paralel dari nomor yang sama bisa sama-sama membaca count 2, lalu keduanya masuk. Batasnya jadi 4 atau lebih.

**Perbaikan:** Pindahkan pengecekan ke dalam transaksi, dan lock baris yang relevan, misalnya dengan `lockForUpdate()` pada `carts` milik pelanggan atau dengan advisory lock per nomor WhatsApp (`pg_advisory_xact_lock(hashtext($phone))`).

---

## B-12 (Rendah): Webhook tanpa rate limit

**Lokasi:** `routes/web.php`, route `/webhooks/payment/midtrans` tanpa throttle. Event dengan signature salah tetap dicatat di `webhook_events` dengan prefix `invalid-`.

**Masalah:** Penyerang bisa mengirim banyak payload palsu dengan ID berbeda. Setiap ID membuat baris baru dan menambah ukuran database.

**Perbaikan:** Tambahkan throttle, misalnya 120 per menit per IP. Opsi lain: jangan simpan event dengan signature salah, cukup catat di log `security`. Walaupun gateway mengirim dari IP tertentu, batas per IP tetap berguna sebagai pertahanan tambahan.

---

## B-13 (Rendah): `/api-docs` terbuka di production

**Lokasi:** `routes/web.php` mendaftarkan `/api-docs` tanpa kondisi. Halaman memuat Tailwind dan Google Fonts dari CDN.

**Masalah:** Dokumentasi API internal terbuka untuk publik. Halaman ini juga memuat resource eksternal yang bertentangan dengan kebijakan CSP di `06-SECURITY.md`.

**Perbaikan:** Daftarkan route hanya jika `app()->environment(['local', 'staging'])`, atau lindungi dengan middleware auth.

---

## B-14 (Rendah): Upload foto memuat seluruh file ke memori

**Lokasi:** `ProductImageController::store` memakai `$file->get()`.

**Masalah:** Untuk file hingga 2 MB tidak masalah. Namun pola ini tidak efisien dan lebih sulit dipertahankan.

**Perbaikan:** Gunakan `Storage::disk($disk)->putFileAs('products', $file, $filename)` atau stream. Jangan percaya `$file->extension()` tanpa validasi MIME di Form Request, karena nilai ini diturunkan dari nama dan tipe yang dikirim client.

---

## Gap: Endpoint di dokumen yang belum ada di kode

Ini bukan bug, tetapi akan memblokir frontend pelanggan.

| Endpoint | Dokumen | Status |
|----------|---------|--------|
| `GET /api/public/menu` | 05-API.md 1.2 | Belum ada |
| `GET /api/public/menu/search` | 05-API.md 1.2 | Belum ada |
| `GET /meja/{qr_token}` | 05-API.md 1.1 | Belum ada, sehingga `cart.mode` dan `table_id` tidak pernah diisi untuk dine-in |
| `POST /mode` | 05-API.md 1.1 | Belum ada |
| `POST /api/public/orders/{token}/reorder` | 05-API.md 1.5 | Belum ada |
| `POST /api/public/orders/{token}/payment` | Usulan B-04 | Belum ada |

Akibat dari `/meja/{qr_token}` yang belum ada: validasi dine-in di `CheckoutService::assertModeAllowed` tidak pernah bisa lolos untuk mode dine-in. Ini perlu diuji setelah route dibuat.

---

## Hal yang belum saya verifikasi

- `DeliveryFeeCalculator` dan `DeliveryZoneResolver` sudah dibaca, tetapi belum diuji dengan kasus batas (jarak tepat di batas zona, subtotal tepat di batas gratis).
- `UpdateCartItemRequest`, `CheckoutRequest`, dan `CheckoutPreviewRequest` belum dibaca penuh, termasuk validasi nomor WhatsApp.
- `PaymentResource` belum dibaca. Perlu dipastikan `raw_payload` tidak ikut dikirim ke publik.
- Migrasi `carts`, `orders`, dan `order_items` belum dicek satu per satu terhadap `03-DATABASE.md`.
- `OrderStatusLog`, `OrderItemAddon`, dan event `OrderPaid` belum dibaca isinya.
- `StaffAuthController` dan `LoginRequest` sudah dibaca, tetapi belum diuji.
- Dokumen `05-API.md` dan `11-DECISIONS.md` di repo sudah berbeda dari versi saya. Perbedaannya belum dibandingkan.

## Langkah yang disarankan

1. Perbaiki B-01, B-02, dan B-03 terlebih dahulu. Ketiganya memengaruhi uang dan alur utama.
2. Perbaiki B-04 dan B-05 sebelum uji beban.
3. Lengkapi endpoint menu, QR meja, dan mode.
4. Jalankan `php artisan test` dan `phpstan`, lalu tambahkan test regresi untuk setiap bug di atas.
