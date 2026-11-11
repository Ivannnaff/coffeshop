# 12 - Go-Live Runbook dan Checklist

Dokumen ini adalah panduan operasional (Runbook) dan daftar periksa (Checklist) untuk peluncuran sistem backend **Menanti Coffee Shop** ke lingkungan produksi (Production).

---

## 1. Prasyarat Lingkungan Produksi

1. **PHP 8.3+**: Pastikan server produksi berjalan di PHP 8.3 atau lebih baru dengan ekstensi wajib (`bcmath`, `ctype`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`).
2. **Database PostgreSQL / Supabase**:
   - Database utama dan tabel terindeks dengan benar.
   - Konfigurasi connection pooling jika menggunakan Supabase.
3. **Queue & Worker (Supervisor / Systemd)**:
   - Queue connection di-set ke `database` atau `redis`.
   - Jalankan *queue worker* dengan supervisor:
     ```bash
     php artisan queue:work --tries=3 --timeout=90
     ```
4. **WebSocket Server (Laravel Reverb)**:
   - Jalankan Reverb *daemon* via Supervisor / systemd:
     ```bash
     php artisan reverb:start --host=0.0.0.0 --port=8080
     ```
5. **Scheduler (Cron Job)**:
   - Tambahkan cron job standar Laravel ke sistem operasi:
     ```cron
     * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
     ```

---

## 2. Checklist Keamanan (Security Hardening)

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` unik dan aman telah di-generate (`php artisan key:generate`).
- [ ] `SESSION_SECURE_COOKIE=true` aktif (HTTPS mandatory).
- [ ] Middleware keamanan (`SecurityHeaders`) aktif dan menyertakan header proteksi (HSTS, X-Content-Type-Options, CSP, X-Frame-Options).
- [ ] Kunci gateway pembayaran (`MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY`) menggunakan mode production (`MIDTRANS_IS_PRODUCTION=true`).
- [ ] Endpoint webhook `/webhooks/payment/midtrans` dapat diakses secara publik oleh server Midtrans via HTTPS dan memverifikasi signature dengan benar.

---

## 3. Monitoring & Logging

- **Health Endpoint**: Pantau secara berkala endpoint `GET /health` untuk memeriksa koneksi database, cache, storage, dan queue (menghasilkan status `200 ok` atau `503 degraded`).
- **Log Channels (`config/logging.php`)**:
  - `audit`: Mencatat seluruh aksi non-GET admin (`POST`, `PUT`, `PATCH`, `DELETE`).
  - `payment`: Mencatat status transaksi pembayaran, pesanan kedaluwarsa (`late_after_expired`), dan penolakan webhook.
  - `security`: Mencatat peringatan keamanan seperti signature webhook tidak valid.

---

## 4. Backup & Restore Prosedur

1. **Backup Database Harian**:
   - Jadwalkan *pg_dump* atau backup otomatis Supabase setiap hari pukul 02:00 WIB.
   - Simpan enkripsi *backup* di penyimpanan eksternal (AWS S3 / Google Cloud Storage).
2. **Restore Prosedur**:
   ```bash
   pg_restore --no-owner -h <host> -U <user> -d <database> backup.dump
   ```

---

## 5. Deployment & Rollback Strategy

1. **Deployment (Zero Downtime / Rolling)**:
   ```bash
   git pull origin main
   composer install --no-dev --optimize-autoloader
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan migrate --force
   php artisan queue:restart
   ```
2. **Rollback Strategy**:
   - Jika migrasi atau rilis bermasalah, kembalikan commit git sebelumnya, jalankan *rollback* migrasi terakhir jika diperlukan (`php artisan migrate:rollback`), dan bersihkan cache (`php artisan optimize:clear`).
