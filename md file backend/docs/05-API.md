# 05 - Kontrak API

Semua endpoint pelanggan menggunakan prefix `/api/public` atau halaman Inertia, sesuai implementasi frontend. Endpoint admin dan barista memakai middleware `auth` dan `role`.

Format response standar:

```json
{
  "data": { },
  "message": "string (opsional)"
}
```

Format error:

```json
{
  "message": "Pesan ringkas untuk pengguna",
  "errors": { "field": ["pesan detail"] },
  "code": "KODE_ERROR_STABIL"
}
```

Kode error stabil yang dipakai frontend:
`VALIDATION_FAILED`, `PRODUCT_UNAVAILABLE`, `ADDON_INVALID`, `OUT_OF_DELIVERY_AREA`, `STORE_CLOSED`, `CART_EXPIRED`, `ORDER_NOT_FOUND`, `INVALID_TRANSITION`, `RATE_LIMITED`.

## 1. Pelanggan (tanpa login)

### 1.1 Meja dan Session
- `GET /meja/{qr_token}`: validasi token, simpan `table_id` dan `mode=dine_in` di session, buat `cart_token` di cookie, redirect ke halaman menu.
- `POST /mode`: body `{ "mode": "takeaway" | "delivery" }`. Ditolak jika session dine-in aktif.

### 1.2 Menu
- `GET /api/public/menu`: kategori, produk aktif, variant, grup add-on, status sold out. Harga ditampilkan dengan `base_price` dan `price_delta`, bukan harga final (harga final dihitung saat keranjang).
- `GET /api/public/menu/search?q=caramel`: pencarian nama produk.

### 1.3 Keranjang
- `GET /api/public/cart`: isi keranjang dengan harga final yang dihitung ulang.
- `POST /api/public/cart/items`
  ```json
  {
    "product_id": 12,
    "variant_ids": [3, 7],
    "addon_ids": [21, 25],
    "qty": 2,
    "note": "gula sedikit"
  }
  ```
- `PATCH /api/public/cart/items/{id}`: body `{ "qty": 3 }` atau `{ "note": "..." }`.
- `DELETE /api/public/cart/items/{id}`

Respon keranjang selalu menyertakan:
```json
{
  "data": {
    "items": [
      {
        "id": 5,
        "product_name": "Es Kopi Susu",
        "unit_price": 19000,
        "qty": 1,
        "line_total": 19000,
        "is_delivery_eligible": true
      }
    ],
    "subtotal": 19000,
    "eligible_subtotal": 19000,
    "min_item_price": 15000
  }
}
```

### 1.4 Checkout

- `POST /api/public/checkout/preview`: menghitung ongkir dan total tanpa membuat pesanan. Dipakai frontend saat pin lokasi berubah. Rate limit ketat.
  ```json
  {
    "mode": "delivery",
    "latitude": -6.9932,
    "longitude": 110.4203
  }
  ```
  Respon: `zone_name`, `distance_km`, `delivery_fee`, `delivery_discount`, `total`, atau error `OUT_OF_DELIVERY_AREA`.

- `POST /api/public/checkout`
  ```json
  {
    "customer_name": "Budi",
    "customer_phone": "081234567890",
    "mode": "takeaway",
    "pickup_note": null,
    "delivery": {
      "address": "Jl. Contoh No. 5, pagar hitam",
      "latitude": -6.9932,
      "longitude": 110.4203
    }
  }
  ```
  Respon `201`:
  ```json
  {
    "data": {
      "order_number": "MNT-261110-0042",
      "public_token": "aB3...",
      "status": "PENDING_PAYMENT",
      "expires_at": "2026-11-10T10:15:00+07:00",
      "total": 42000,
      "payment": {
        "gateway": "midtrans",
        "redirect_url": "https://..."
      }
    }
  }
  ```
  Field `delivery` wajib jika `mode = delivery`, dan tidak boleh ada jika `mode` lain. Field `table_id` tidak diterima dari client.

### 1.5 Status Pesanan
- `GET /api/public/orders/{public_token}`: status, progres, total, dan `expires_at` jika `PENDING_PAYMENT`.
- Channel real-time: `order.{public_token}`, event `OrderStatusChanged`.
- `POST /api/public/orders/{public_token}/reorder`: menyalin item ke keranjang baru dengan cookie baru. Item yang sudah tidak tersedia dilaporkan dalam respon.

## 2. Webhook Pembayaran

- `POST /webhooks/payment/midtrans`
- `POST /webhooks/payment/xendit`

Aturan:
- Dikecualikan dari CSRF, tetapi wajib memverifikasi signature sebelum memproses apa pun.
- Respon `200` untuk webhook yang valid (termasuk duplikat). Respon `401` untuk signature salah. Respon `4xx` tidak boleh menyebabkan gateway retry tanpa batas, jadi webhook yang tidak valid cukup dicatat dan dibalas `401`.
- Pemrosesan dilakukan dalam transaksi database dengan `lockForUpdate()` pada baris `orders`.

## 3. KDS (Barista dan Admin)

- `GET /kds/orders?status=PAID,PREPARING`: antrean untuk KDS, diurutkan `paid_at` naik.
- `POST /kds/orders/{id}/start`: `PAID` ke `PREPARING`.
- `POST /kds/orders/{id}/ready`: `PREPARING` ke `READY`.
- `POST /kds/orders/{id}/complete`: `READY` ke `COMPLETED` (dine-in dan takeaway).
- `POST /kds/orders/{id}/dispatch`: `READY` ke `OUT_FOR_DELIVERY` (delivery).
- `POST /kds/orders/{id}/deliver`: `OUT_FOR_DELIVERY` ke `COMPLETED` (delivery).

Setiap endpoint transisi mengembalikan status terbaru dan `version` untuk mencegah update ganda. Jika transisi tidak valid, respon `409` dengan kode `INVALID_TRANSITION`.

## 4. Admin

Semua route di bawah `/admin`, dengan middleware `auth` dan `role:admin`.

- **Kategori:** `GET`, `POST`, `PUT /{id}`, `DELETE /{id}`
- **Produk:** `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` (soft delete), `PATCH /{id}/sold-out`
- **Varian dan add-on:** CRUD di bawah produk dan grup
- **Grup add-on:** CRUD, dan `PUT /products/{id}/addon-groups` untuk sinkronisasi pivot
- **Foto produk:** `POST /products/{id}/image`, unggah ke Supabase Storage, simpan path
- **Meja:** CRUD, `POST /tables/{id}/regenerate-token`
- **Pengaturan toko:** `GET`, `PUT`
- **Zona delivery:** CRUD, dan CRUD `delivery_fee_rules`
- **Laporan:** `GET /reports/summary?from=2026-11-01&to=2026-11-30`
  ```json
  {
    "data": {
      "from": "2026-11-01",
      "to": "2026-11-30",
      "total_revenue": 5400000,
      "total_items_sold": 312,
      "total_orders": 148,
      "top_products": [
        { "name": "Es Kopi Susu", "qty": 74 }
      ]
    }
  }
  ```
  - Filter memakai `paid_at` dengan zona waktu `Asia/Jakarta`; `from` dan `to` format `Y-m-d`, dan `to` tidak boleh lebih awal dari `from`.
  - Hanya status `PAID`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, dan `COMPLETED` yang dihitung.
  - Jika `from`/`to` tidak dikirim, default-nya awal bulan berjalan sampai hari ini.
  - Ringkasan di-cache 30 menit dengan key berversi; cache otomatis tidak berlaku lagi saat ada pesanan yang masuk hitungan penjualan atau berubah status.

## 5. Real-time (WebSocket)

Broadcast memakai **Laravel Reverb**. Event di-dispatch setelah transaksi database commit (`ShouldDispatchAfterCommit`), sehingga status yang dikirim selalu sesuai data yang tersimpan.

- **Channel publik pelanggan:** `order.{public_token}`. Tidak butuh otorisasi; token acak 48 karakter dan payload tidak memuat data pribadi.
- **Channel privat KDS:** `kds.store.{store_id}`. Klien mengotorisasi lewat `POST /broadcasting/auth` dengan session staf. Hanya user aktif dengan role `barista` atau `admin` yang diterima.

Event:

| Event | Kapan dikirim | Payload |
|-------|---------------|---------|
| `OrderPaid` | Transisi `PENDING_PAYMENT` → `PAID` | `order_id`, `order_number`, `public_token`, `status`, `paid_at` |
| `OrderStatusChanged` | Setiap perubahan status | `order_id`, `order_number`, `public_token`, `from_status`, `to_status`, `updated_at` |

Nama event pada payload broadcast adalah `OrderPaid` dan `OrderStatusChanged`.

Fallback polling: jika WebSocket gagal, KDS memanggil `GET /kds/orders` setiap 10 detik dan pelanggan memanggil `GET /api/public/orders/{public_token}`.

Menjalankan layanan:

```bash
php artisan reverb:start
php artisan queue:work
```

`queue:work` diperlukan karena event `ShouldBroadcast` dikirim lewat queue (default `database`).

## 6. Aturan Umum API

- Versi API tidak perlu di URL pada MVP. Perubahan breaking dicatat di `11-DECISIONS.md`.
- Semua tanggal dalam ISO 8601 dengan offset `+07:00`.
- Semua uang dalam integer rupiah, tanpa format string.
- Pagination dengan `page` dan `per_page` (maks 100).
- Input dari client selalu divalidasi dengan Form Request.
