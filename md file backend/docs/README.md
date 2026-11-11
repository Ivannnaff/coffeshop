# Project Laravel Menanti - Dokumentasi Backend

Dokumentasi ini adalah sumber kebenaran (source of truth) untuk pengembangan backend Website Coffee Shop Menanti. Setiap keputusan teknis dan bisnis yang sudah disepakati tercatat di sini. Jika ada perubahan, perbarui dokumen terkait sebelum mengubah kode.

## Daftar Dokumen

| No | File | Isi |
|----|------|-----|
| 01 | [01-PRD.md](01-PRD.md) | Tujuan produk, pengguna, fitur, dan scope MVP |
| 02 | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Struktur sistem, komponen, dan alur data |
| 03 | [03-DATABASE.md](03-DATABASE.md) | Skema tabel, relasi, index, dan aturan data |
| 04 | [04-BUSINESS-RULES.md](04-BUSINESS-RULES.md) | Aturan bisnis: state machine pesanan, harga, ongkir, expired |
| 05 | [05-API.md](05-API.md) | Daftar endpoint, kontrak request dan response |
| 06 | [06-SECURITY.md](06-SECURITY.md) | Keamanan: harga, webhook, token, rate limit, akses admin |
| 07 | [07-CODING-RULES.md](07-CODING-RULES.md) | Konvensi kode, struktur folder, dan aturan review |
| 08 | [08-TESTING.md](08-TESTING.md) | Strategi testing dan kasus uji wajib |
| 09 | [09-ENVIRONMENT.md](09-ENVIRONMENT.md) | Setup lokal, environment variable, dan deployment |
| 10 | [10-ROADMAP.md](10-ROADMAP.md) | Tahapan pengerjaan backend dari fondasi sampai real-time |
| 11 | [11-DECISIONS.md](11-DECISIONS.md) | Architecture Decision Records dan keputusan yang masih terbuka |

## Prinsip Utama

1. **Server adalah sumber kebenaran** untuk harga, ongkir, dan status pesanan.
2. **Pelanggan tidak punya akun.** Hanya admin dan barista yang login.
3. **Uang disimpan sebagai integer rupiah** (`bigInteger`), tidak pernah `float` atau `decimal`.
4. **Setiap pesanan menyimpan snapshot** harga, nama, dan aturan yang berlaku saat transaksi.
5. **Setiap perubahan status dicatat** di `order_status_logs`.
6. **Zona waktu** adalah `Asia/Jakarta`.
