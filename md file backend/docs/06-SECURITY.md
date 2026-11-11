# 06 - Keamanan

## 1. Prinsip

1. **Jangan percaya client** untuk harga, status, ID meja, dan total.
2. **Verifikasi setiap sumber masuk**: webhook, cookie, token, dan input form.
3. **Batasi akses sesuai peran** dengan prinsip least privilege.
4. **Catat setiap perubahan penting** untuk audit.

## 2. Harga dan Total

- Harga dan ongkir hanya dihitung di server (`PriceCalculator`, `DeliveryFeeCalculator`).
- Request checkout tidak boleh berisi `total`, `price`, `delivery_fee`, `table_id`, atau `status`. Jika dikirim, field tersebut diabaikan oleh Form Request, bukan dipercaya.
- Total yang dibayar ke gateway diambil dari `orders.total` di server, bukan dari request.
- Koordinat pengiriman dihitung jaraknya di server. Hasil jarak dari client tidak dipakai.

## 3. Webhook Pembayaran

- Verifikasi signature sesuai dokumentasi gateway sebelum membaca isi payload:
  - Midtrans: `SHA512(order_id + status_code + gross_amount + ServerKey)` dibandingkan dengan `signature_key`.
  - Xendit: verifikasi header `x-callback-token` dengan token callback.
  *Detail akan dikonfirmasi saat gateway dipilih.*
- Verifikasi tambahan: cocokkan `gross_amount` dengan `orders.total` dan `order_number` dengan database. Jika tidak cocok, tolak dan catat sebagai `rejected`.
- Idempotensi: `(gateway, gateway_transaction_id)` unik di tabel `payments`. Pemrosesan kedua dicatat sebagai `duplicate`.
- Pemrosesan dalam transaksi dengan `lockForUpdate()` pada `orders`, agar dua webhook bersamaan tidak membuat status tidak konsisten.
- Jangan pernah mengubah status pesanan dari endpoint lain selain webhook untuk pembayaran.
- Simpan `raw_payload` untuk audit, tetapi jangan log nomor kartu atau data sensitif lain.

## 4. Token Publik

- Cart token, QR token meja, dan `public_token` pesanan dibuat dengan `Str::random(48)` (atau lebih panjang).
- Tidak ada ID berurutan yang diekspos ke pelanggan. Route pelanggan memakai token, bukan `id`.
- `public_token` pesanan memberi akses baca ke satu pesanan. Tidak boleh bisa dipakai untuk mengubah status.
- QR meja dapat diregenerasi. Token lama langsung tidak berlaku.
- Cookie keranjang: `HttpOnly`, `Secure` (di production), `SameSite=Lax`.

## 5. Rate Limit

| Endpoint | Batas |
|----------|-------|
| `POST /api/public/checkout` | 5 per menit per IP, dan 3 pesanan `PENDING_PAYMENT` aktif per nomor WhatsApp |
| `POST /api/public/checkout/preview` | 30 per menit per IP |
| `POST /api/public/cart/items` | 60 per menit per cart |
| `POST /webhooks/*` | Tanpa batas per IP, karena berasal dari gateway. Dibatasi oleh verifikasi signature. |
| Login admin | 5 percobaan per menit per IP (bawaan Breeze, dipertahankan) |

Pembatasan pesanan per nomor WhatsApp mencegah spam pesanan palsu, karena pelanggan tanpa login tidak punya identitas lain.

## 6. Akses Admin dan Barista

- Middleware `role:admin` dan `role:barista,admin` untuk route masing-masing.
- Barista tidak bisa mengakses route CRUD menu, meja, atau laporan.
- Barista hanya bisa mengubah status pesanan lewat endpoint KDS.
- User yang `is_active = false` tidak bisa login, bahkan dengan password yang benar.
- Admin tidak bisa menghapus akunnya sendiri.
- Password memakai bcrypt (default Laravel). Panjang minimal 12 karakter untuk admin.
- Session regenerasi setelah login dan logout (bawaan Breeze).

## 7. Real-time

- Channel `order.{public_token}`: publik (siapa pun yang punya token), hanya untuk event status, tanpa data sensitif.
- Channel `kds.{store_id}`: privat, otorisasi lewat `routes/channels.php` dan hanya untuk role `barista` atau `admin`.
- Payload event tidak berisi nomor WhatsApp atau alamat lengkap.

## 8. Input dan Output

- Semua input divalidasi dengan Form Request. Tidak ada `$request->all()` di model.
- Gunakan `$fillable` atau `$guarded` yang eksplisit di setiap model. Hindari `$guarded = []`.
- Output API lewat API Resource, agar kolom sensitif tidak ikut terkirim.
- Upload foto: validasi MIME (`image/jpeg`, `image/png`, `image/webp`), ukuran maksimal 2 MB, nama file dibuat ulang (UUID), bukan dari nama asli.
- Escape output di Blade dan Inertia. Hindari `{!! !!}` kecuali untuk konten yang sudah disanitasi.

## 9. Data Pribadi

- Nomor WhatsApp dan alamat pelanggan adalah data pribadi. Hanya ditampilkan ke admin dan barista yang berwenang.
- Tidak dipakai untuk tujuan lain selain konfirmasi dan pengiriman pesanan.
- Log aplikasi tidak boleh berisi nomor WhatsApp utuh. Gunakan masking, misalnya `0812****7890`.
- Tetapkan kebijakan retensi: data pesanan dihapus atau dianonimkan setelah periode tertentu. Keputusan periode ada di `11-DECISIONS.md`.

## 10. Konfigurasi

- `APP_DEBUG=false` di production.
- `APP_KEY` berbeda tiap environment dan tidak pernah di-commit.
- Kredensial gateway, Supabase, dan Maps hanya di `.env`, tidak pernah di repo.
- `.env.example` hanya berisi nama variabel tanpa nilai rahasia.
- Aktifkan HTTPS dan HSTS di production.
- Set header keamanan dasar: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan Content Security Policy untuk halaman Inertia.

## 11. Logging dan Monitoring

- Log terpisah untuk channel `payment`, `audit`, dan `security`.
- Alert ke admin untuk: webhook signature gagal berulang, `late_after_expired`, transisi tidak valid, dan lonjakan request ke checkout.
- Error tracking (misalnya Sentry) di production, dengan data sensitif difilter.

## 12. Dependensi

- Jalankan `composer audit` dan `npm audit` secara berkala.
- Update Laravel dan paket keamanan sesuai rilis patch.
- Jangan menambah paket pihak ketiga tanpa alasan yang tercatat.

## 13. Daftar Periksa Sebelum Production

- [ ] Verifikasi signature webhook sudah diuji dengan payload palsu.
- [ ] Harga di checkout tidak bisa diubah dari request (diuji dengan request yang dimanipulasi).
- [ ] `table_id` dari request diabaikan.
- [ ] Route KDS menolak user dengan role `customer` atau tanpa login.
- [ ] Rate limit checkout aktif.
- [ ] `APP_DEBUG=false`.
- [ ] Tidak ada kredensial di repo (cek dengan `gitleaks` atau sejenisnya).
