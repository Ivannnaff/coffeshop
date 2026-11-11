# 09 - Environment dan Deployment

## 1. Environment

| Environment | Tujuan | Database | Gateway | Maps |
|-------------|--------|----------|---------|------|
| `local` | Pengembangan | PostgreSQL lokal (Docker) | Sandbox | Haversine atau kuota dev |
| `staging` | Uji sebelum rilis | Supabase project staging | Sandbox | Kuota terbatas |
| `production` | Operasional | Supabase project production | Production | Production |

## 2. Setup Lokal

```bash
# 1. Clone repo dan masuk ke folder
git clone <repo> menanti && cd menanti

# 2. Instal dependensi
composer install
npm install

# 3. Salin environment
cp .env.example .env
php artisan key:generate

# 4. Jalankan PostgreSQL lokal (opsional, sebagai pengganti Supabase)
docker compose up -d db

# 5. Migrasi dan seed
php artisan migrate --seed

# 6. Jalankan semua layanan dev
composer run dev   # serve, queue, reverb, vite (sesuaikan dengan scripts di composer.json)
```

## 3. Environment Variable

```env
# Aplikasi
APP_NAME="Menanti"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Jakarta

# Database (Supabase PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=
DB_PASSWORD=
DB_SSLMODE=require

# Storage (Supabase Storage via S3-compatible)
FILESYSTEM_DISK=supabase
SUPABASE_S3_KEY=
SUPABASE_S3_SECRET=
SUPABASE_S3_REGION=
SUPABASE_S3_ENDPOINT=
SUPABASE_S3_BUCKET=menanti-products
SUPABASE_PUBLIC_URL=

# Queue, cache, session
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database
SESSION_LIFETIME=120

# Payment gateway (isi sesuai pilihan di 11-DECISIONS.md)
PAYMENT_GATEWAY=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=
PAYMENT_EXPIRY_MINUTES=15

# Real-time (Reverb)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=
REVERB_PORT=443
REVERB_SCHEME=https

# Maps
MAPS_PROVIDER=haversine
GOOGLE_MAPS_API_KEY=
STORE_LATITUDE=-6.9932
STORE_LONGITUDE=110.4203

# Monitoring
SENTRY_LARAVEL_DSN=
LOG_CHANNEL=stack
LOG_LEVEL=info
```

Aturan:
- `.env` tidak pernah di-commit. `.env.example` hanya berisi nama variabel.
- Koordinat toko boleh ada di `store_settings` juga. Variabel di atas sebagai fallback.
- `APP_DEBUG=false` wajib di staging dan production.

## 4. Konfigurasi Penting

- `config/filesystems.php`: tambahkan disk `supabase` dengan driver `s3`, `use_path_style_endpoint` sesuai dokumentasi Supabase.
- `config/database.php`: `pgsql` dengan `sslmode=require` di production.
- `config/logging.php`: channel `payment`, `audit`, dan `security`.
- `config/reverb.php`: sesuaikan host dan port dengan reverse proxy.
- Scheduler (`routes/console.php`): `expire-unpaid-orders` tiap menit, `prune-carts` tiap jam.

## 5. Supabase

- Buat project terpisah untuk staging dan production.
- Aktifkan Row Level Security tidak diperlukan karena akses data hanya lewat Laravel, tetapi tetap disarankan agar tidak ada akses langsung dari client publik. Gunakan service role hanya di server.
- Jangan pakai API key Supabase di frontend.
- Bucket `menanti-products` dibuat public read untuk gambar produk. Upload hanya lewat Laravel.
- Backup otomatis aktif. Catat jadwal dan prosedur restore di runbook.

## 6. Deployment

### 6.1 Infrastruktur yang Disarankan
- Server: VPS dengan Nginx, PHP-FPM 8.3, dan Supervisor untuk queue dan Reverb.
- Atau platform managed seperti Laravel Forge atau Laravel Cloud.
- Reverse proxy HTTPS dengan sertifikat otomatis.

### 6.2 Langkah Rilis
1. Merge ke `main` setelah CI lulus.
2. Pipeline build aset (`npm run build`) dan paket Composer dengan `--no-dev`.
3. Jalankan `php artisan down` jika ada migrasi yang mengunci tabel besar.
4. Jalankan `php artisan migrate --force`.
5. Jalankan `php artisan config:cache`, `route:cache`, `view:cache`.
6. Restart queue worker (`php artisan queue:restart`) dan Reverb.
7. `php artisan up`.
8. Smoke test: buka menu, buat pesanan sandbox, cek webhook.

### 6.3 Rollback
- Kode: kembali ke rilis sebelumnya.
- Migrasi: setiap migrasi punya `down()` yang teruji. Migrasi yang menghapus data tidak diperbolehkan tanpa backup dan persetujuan.
- Webhook yang gagal diproses bisa dijalankan ulang dari `webhook_events` atau dashboard gateway.

## 7. Monitoring Production

- Uptime check ke halaman menu dan endpoint checkout preview.
- Monitor queue: jumlah job tertunda dan job gagal.
- Monitor scheduler: pastikan `expire-unpaid-orders` berjalan tiap menit.
- Alert saat `webhook_events.result = rejected` atau `late_after_expired` muncul.
- Dashboard ringkas: jumlah pesanan per jam, dan error rate.

## 8. Checklist Go-Live

- [ ] Sandbox gateway sudah diuji end-to-end.
- [ ] Gateway production sudah diaktifkan dan URL webhook sudah didaftarkan.
- [ ] Koordinat toko dan zona delivery sudah benar.
- [ ] Jam operasional dan `is_accepting_orders` sudah diatur.
- [ ] QR meja sudah dicetak dengan token yang benar.
- [ ] Akun admin dan barista dibuat, password diganti.
- [ ] Backup Supabase dan prosedur restore sudah diuji.
- [ ] Alert dan monitoring aktif.
- [ ] Tim barista sudah dilatih memakai KDS.
