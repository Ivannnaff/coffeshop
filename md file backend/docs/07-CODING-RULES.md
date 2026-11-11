# 07 - Aturan Koding

## 1. Versi dan Standar

- PHP 8.3 atau lebih baru. Laravel versi LTS terbaru yang tersedia saat proyek dimulai.
- Gunakan `declare(strict_types=1);` di semua file PHP aplikasi.
- Ikuti PSR-12 dan format dengan Laravel Pint (`./vendor/bin/pint`).
- Static analysis dengan PHPStan atau Larastan level 6 atau lebih tinggi.

## 2. Penamaan

| Jenis | Konvensi | Contoh |
|-------|----------|--------|
| Model | Tunggal, PascalCase | `OrderItem` |
| Tabel | Jamak, snake_case | `order_items` |
| Controller | Tunggal atau jamak sesuai resource, akhiran `Controller` | `KdsOrderController` |
| Service | Akhiran `Service` | `CheckoutService` |
| Domain calculator | Akhiran `Calculator` | `PriceCalculator` |
| Enum | PascalCase, nilai string UPPER_SNAKE | `OrderStatus::PENDING_PAYMENT` |
| Event | Kata kerja lampau | `OrderPaid`, `OrderStatusChanged` |
| Job | Kata kerja, akhiran `Job` | `ExpireUnpaidOrdersJob` |
| Exception | Akhiran `Exception` | `InvalidOrderTransition` |
| Route name | `dot.notation` | `admin.products.index` |

## 3. Struktur Folder

```
app/
├── Actions/                  # Aksi tunggal yang sederhana (opsional)
├── Console/Commands/
├── Domain/
│   ├── Order/
│   │   ├── OrderStatus.php
│   │   ├── OrderStateMachine.php
│   │   └── Exceptions/
│   ├── Pricing/
│   │   ├── PriceCalculator.php
│   │   └── DTO/
│   └── Delivery/
│       ├── DeliveryZoneResolver.php
│       └── DeliveryFeeCalculator.php
├── Services/
│   ├── CheckoutService.php
│   ├── CartService.php
│   ├── OrderStatusService.php
│   ├── PaymentService.php
│   └── Payment/
│       ├── MidtransGateway.php
│       └── XenditGateway.php
├── Http/
│   ├── Controllers/
│   │   ├── Public/
│   │   ├── Kds/
│   │   └── Admin/
│   ├── Requests/
│   ├── Resources/
│   └── Middleware/
├── Models/
├── Events/
├── Listeners/
├── Jobs/
└── Policies/
```

## 4. Aturan Lapisan

1. **Controller** hanya: validasi (Form Request), panggil service, kembalikan Resource. Maksimal sekitar 15 baris per method.
2. **Service** mengatur transaksi database, memanggil domain, dan memicu event.
3. **Domain** adalah PHP murni, tanpa dependensi ke Eloquent atau request. Dimudahkan dengan unit test.
4. **Model** hanya berisi relasi, casts, dan scope sederhana. Tidak ada logika bisnis.
5. Akses ke gateway pembayaran hanya lewat interface `PaymentGateway`.

## 5. Aturan Data

- Gunakan Data Transfer Object (DTO) atau `readonly class` PHP 8.2+ untuk input antar-layer, bukan array asosiatif.
- Gunakan `enum` PHP untuk status, tipe varian, dan mode pemesanan.
- Uang selalu `int`. Dilarang menggunakan `float` untuk nilai rupiah.
- Tanggal dan waktu memakai Carbon dengan zona `Asia/Jakarta`.

## 6. Aturan Transaksi Database

- Operasi yang mengubah lebih dari satu tabel wajib dibungkus `DB::transaction()`.
- Gunakan `lockForUpdate()` untuk perubahan status pesanan dan konsumsi webhook.
- Hindari query di dalam loop. Gunakan `with()` untuk eager loading.
- Jangan memanggil API eksternal (gateway, Maps) di dalam transaksi database. Panggil sebelum atau sesudah.

## 7. Aturan Event dan Job

- Event broadcast dikirim setelah transaksi commit: gunakan `ShouldDispatchAfterCommit` atau `afterCommit()`.
- Job yang memanggil API eksternal wajib punya `$tries`, `$backoff`, dan `$timeout`.
- Job harus idempoten. Menjalankannya dua kali tidak boleh menghasilkan efek ganda.

## 8. Error Handling

- Gunakan exception domain yang spesifik, misalnya `InvalidOrderTransition`, `ProductUnavailableException`, `OutOfDeliveryAreaException`.
- Exception domain dipetakan ke kode error API di exception handler.
- Jangan menangkap `\Throwable` tanpa melempar ulang atau mencatat. Jangan menelan error diam-diam.
- Pesan error untuk pengguna dalam Bahasa Indonesia. Pesan log dalam Bahasa Inggris atau Indonesia, tetapi konsisten dalam satu proyek.

## 9. Penamaan Variabel dan Kode

- Nama variabel dan method dalam Bahasa Inggris.
- Komentar dalam Bahasa Indonesia diperbolehkan untuk menjelaskan aturan bisnis, dengan merujuk ke `04-BUSINESS-RULES.md` jika relevan.
- Konstanta bisnis (misalnya ambang Rp15.000) tidak boleh hardcode. Ambil dari `store_settings`.

## 10. Git

- Branch: `main` (production), `develop` (integrasi), `feature/nama-fitur`, `fix/nama-bug`.
- Commit message mengikuti Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Pull request wajib minimal satu review.
- Migrasi yang sudah di-merge tidak boleh diedit. Perubahan skema dibuat sebagai migrasi baru.
- Jangan commit `.env`, file cache, atau file upload lokal.

## 11. Checklist Pull Request

- [ ] Ada test untuk perubahan logika bisnis.
- [ ] Tidak ada hardcode nilai bisnis atau kredensial.
- [ ] Perubahan uang memakai integer.
- [ ] Perubahan status pesanan lewat `OrderStatusService`.
- [ ] Input baru divalidasi di Form Request.
- [ ] Output baru lewat API Resource.
- [ ] Dokumen terkait di folder `docs/` sudah diperbarui jika ada perubahan aturan.
- [ ] `pint`, PHPStan, dan test lulus.
