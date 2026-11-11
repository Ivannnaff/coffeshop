# 08 - Strategi Testing

## 1. Piramida Test

| Lapisan | Porsi | Alat | Fokus |
|---------|-------|------|-------|
| Unit | Banyak | PHPUnit atau Pest, tanpa database | `PriceCalculator`, `DeliveryFeeCalculator`, `OrderStateMachine` |
| Feature | Sedang | Pest dengan `RefreshDatabase` dan PostgreSQL test | Endpoint, service, transaksi, webhook |
| Integrasi | Sedikit | Sandbox gateway, sandbox Maps | Alur pembayaran nyata, jarak nyata |
| Manual | Per rilis | Checklist QA | Alur pelanggan dan KDS di perangkat nyata |

## 2. Database Test

- Gunakan PostgreSQL yang sama dengan production (bisa lewat Docker), bukan SQLite, karena perbedaan tipe data dan constraint bisa menyembunyikan bug.
- Konfigurasi `phpunit.xml` mengarah ke database `menanti_test`.
- Gunakan `RefreshDatabase` untuk feature test.

## 3. Kasus Uji Wajib: Mesin Harga

Ini bagian paling kritis. Setiap kasus di bawah wajib ada di unit test.

| Kasus | Input | Hasil yang diharapkan |
|-------|-------|-----------------------|
| Harga dasar tanpa add-on | Es Kopi Susu Rp14.000, qty 1 | unit 14.000, eligible 0 |
| Dengan Extra Shot | Rp14.000 + Extra Shot Rp5.000, qty 1 | unit 19.000, eligible = true |
| Qty tidak mengubah kelayakan | Rp14.000, qty 2 | unit 14.000, eligible 0, line 28.000 |
| Batas tepat Rp15.000 | Harga final 15.000 | eligible = true (≥) |
| Batas Rp14.999 | Harga final 14.999 | eligible = false |
| Varian ukuran Large | Base 14.000 + Large 3.000 | unit 17.000 |
| Varian negatif | Base 14.000 + delta -2.000 | unit 12.000 |
| Promo dihitung sebelum eligibility | Base 20.000, promo 30% | unit 14.000, eligible = false |
| Campuran item | 1 item eligible 19.000, 1 item tidak 12.000 | eligible_subtotal 19.000, subtotal 31.000 |
| Harga negatif di-clamp | Promo melebihi harga | unit 0, anomali tercatat |

## 4. Kasus Uji Ongkir

| Kasus | Hasil |
|-------|-------|
| Jarak 2 km, zona 1 (maks 3 km) | zona 1 dipilih |
| Jarak 3,01 km, zona 1 (maks 3 km) | zona 2 dipilih |
| Jarak di luar semua zona | `OUT_OF_DELIVERY_AREA` |
| eligible_subtotal ≥ batas gratis | ongkir 0 |
| eligible_subtotal < batas gratis | ongkir penuh |
| Subtotal besar tapi semua item tidak eligible | ongkir penuh |
| Diskon persen dengan pembulatan | dibulatkan ke bawah |

## 5. Kasus Uji State Machine

- Setiap transisi yang diizinkan di `04-BUSINESS-RULES.md` diuji sekali.
- Setiap transisi yang tidak diizinkan diuji dan menghasilkan `InvalidOrderTransition`.
- `OUT_FOR_DELIVERY` ditolak untuk `dine_in` dan `takeaway`.
- Transisi dari `EXPIRED` dan `COMPLETED` ditolak semua.
- Setiap transisi menghasilkan satu baris di `order_status_logs`.

## 6. Kasus Uji Webhook

| Kasus | Hasil |
|-------|-------|
| Signature valid, pesanan `PENDING_PAYMENT` | status `PAID`, `paid_at` terisi, event dikirim |
| Signature salah | `401`, tidak ada perubahan, tercatat `rejected` |
| Payload sama dikirim dua kali | kedua kalinya `duplicate`, status tidak berubah |
| `gross_amount` tidak cocok dengan `total` | ditolak, tercatat `rejected` |
| Webhook datang setelah `EXPIRED` | status tetap `EXPIRED`, tercatat `late_after_expired`, admin dinotifikasi |
| Dua webhook bersamaan | hanya satu yang mengubah status (uji dengan proses paralel) |

## 7. Kasus Uji Checkout

- Checkout dengan `table_id` dari request diabaikan.
- Checkout dengan `total` atau `price` dari request diabaikan.
- Produk sold out saat checkout ditolak dengan `PRODUCT_UNAVAILABLE`.
- Toko tutup ditolak dengan `STORE_CLOSED`.
- Lebih dari 3 pesanan aktif untuk satu nomor WhatsApp ditolak dengan `RATE_LIMITED`.
- Pesanan delivery tanpa koordinat ditolak.
- Pesanan dine-in dari token meja yang sudah diregenerasi ditolak.

## 8. Kasus Uji Keamanan

- Pelanggan tanpa role tidak bisa mengakses `/kds` dan `/admin`.
- Barista tidak bisa mengakses CRUD menu atau laporan (`403`).
- User `is_active = false` tidak bisa login.
- `public_token` pesanan A tidak bisa dipakai untuk mengubah status.
- Channel `kds.*` menolak subscriber tanpa role yang tepat.

## 9. Kasus Uji Expired

- Pesanan dengan `expires_at` lewat berubah menjadi `EXPIRED` setelah job berjalan.
- Pesanan yang sudah `PAID` tidak ikut diubah oleh job expired.
- Job expired dijalankan dua kali menghasilkan hasil yang sama (idempoten).

## 10. Test Non-Fungsional

- Beban checkout: 50 request per detik selama 1 menit, tanpa error 5xx dan tanpa pesanan duplikat.
- Query antrean KDS dengan 500 pesanan aktif di bawah 200 ms.
- Laporan bulanan dengan 50.000 pesanan di bawah 1 detik (dengan index yang tepat).

## 11. Cakupan dan CI

- Target cakupan unit test untuk folder `Domain/` minimal 90%.
- CI menjalankan: `pint --test`, PHPStan, dan seluruh test pada setiap pull request.
- Pipeline gagal jika salah satu tahap gagal.

## 12. Data Uji

- Seeder terpisah untuk data demo: kategori, produk, varian, grup add-on, meja, dan zona.
- Factory untuk setiap model. Gunakan state untuk kasus khusus (misalnya `->expired()`, `->paid()`).
- Data produksi tidak pernah dipakai untuk testing.
