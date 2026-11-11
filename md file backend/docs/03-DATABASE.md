# 03 - Desain Database

Database: PostgreSQL (Supabase). Semua tabel memakai `bigIncrements` sebagai primary key kecuali disebutkan lain. Semua tabel memiliki `created_at` dan `updated_at`.

## 1. Konvensi

- Nama tabel jamak, snake_case (`order_items`).
- Foreign key: `{tabel_tunggal}_id`, dengan index dan constraint `ON DELETE` yang eksplisit.
- Uang: `bigInteger` dalam rupiah utuh. Kolom diberi suffix `_amount` atau nama yang jelas (`price`, `total`).
- Token publik (QR meja, link pesanan, cart token): `string(64)` unik, dibuat dari `Str::random(48)`, disimpan dalam bentuk plain (tidak perlu hash karena bukan kredensial), tetapi tidak pernah dipakai sebagai ID berurutan.
- Status disimpan sebagai `string` dengan validasi di aplikasi (lihat `04-BUSINESS-RULES.md`), bukan PostgreSQL ENUM, agar mudah ditambah tanpa migrasi tipe.
- Soft delete hanya untuk `products`, `addons`, dan `tables`. Pesanan tidak pernah dihapus.

## 2. Kelompok Tabel

### 2.1 Pengaturan Toko
**store_settings** (satu baris per toko, siap multi-outlet)
- `id`, `store_id` (default 1), `name`, `address`, `latitude`, `longitude`
- `opening_time`, `closing_time`, `timezone` (default `Asia/Jakarta`)
- `is_accepting_orders` (boolean, bisa dimatikan manual admin)
- `payment_expiry_minutes` (default 15)
- `delivery_min_item_price` (default 15000) — ambang harga final per unit untuk dihitung diskon ongkir
- `updated_at`

### 2.2 Katalog
**categories**: `id`, `name`, `slug` (unik), `sort_order`, `is_active`

**products**: `id`, `category_id` (FK), `name`, `slug` (unik), `description`, `base_price`, `image_path`, `is_sold_out` (boolean), `is_active`, `badge` (nullable: `promo`, `best_seller`), `sort_order`, `deleted_at`
- Index: `category_id`, `is_active`, gabungan `(is_active, is_sold_out)`

**product_variants**: `id`, `product_id` (FK), `type` (`size` atau `temperature`), `name` (Regular, Large, Hot, Iced), `price_delta` (integer, boleh 0 atau negatif), `is_default`, `sort_order`
- Constraint unik: `(product_id, type, name)`

**addon_groups**: `id`, `name` (misal "Susu", "Sugar Level"), `selection_type` (`single` atau `multiple`), `min_select` (default 0), `max_select` (nullable), `is_active`

**addons**: `id`, `addon_group_id` (FK), `name`, `price_delta` (0 untuk gratis), `is_sold_out`, `is_active`, `sort_order`, `deleted_at`

**product_addon_group**: `product_id`, `addon_group_id`, `sort_order`
- Primary key gabungan. Menentukan grup add-on apa saja yang tersedia untuk produk tertentu.

### 2.3 Operasional
**tables**: `id`, `store_id`, `number` (label meja, misal "A3"), `qr_token` (unik), `is_active`, `deleted_at`
- Admin bisa meregenerasi `qr_token`. Token lama langsung tidak berlaku.

### 2.4 Delivery
**delivery_zones**: `id`, `store_id`, `name`, `max_distance_km` (decimal 5,2 — boleh desimal karena ini jarak, bukan uang), `base_fee` (integer rupiah), `free_fee_min_subtotal` (nullable), `sort_order`, `is_active`
- Zona diurutkan berdasarkan `max_distance_km` untuk pencarian.

**delivery_fee_rules**: `id`, `delivery_zone_id` (FK), `min_eligible_subtotal` (integer), `discount_type` (`free` atau `percent`), `discount_value` (nullable), `is_active`
- Dipakai jika aturan ongkir lebih dari satu tingkat per zona. Jika cukup satu aturan, kolom `free_fee_min_subtotal` di `delivery_zones` sudah mencukupi. Pilihan ini ditetapkan saat implementasi.

### 2.5 Keranjang
**carts**: `id`, `token` (unik), `mode` (`dine_in`, `takeaway`, `delivery`), `table_id` (nullable, FK), `last_activity_at`, `expires_at`
- Dibersihkan oleh scheduler saat `expires_at` lewat.

**cart_items**: `id`, `cart_id` (FK, cascade delete), `product_id` (FK), `product_variant_ids` (JSON, berisi ID variant size dan temperature), `qty` (integer, minimal 1), `note` (nullable, maks 140 karakter)

**cart_item_addons**: `cart_item_id` (FK, cascade), `addon_id` (FK)
- Primary key gabungan `(cart_item_id, addon_id)`

Catatan: keranjang tidak menyimpan harga. Harga selalu dihitung ulang saat render dan saat checkout.

### 2.6 Pesanan
**orders**
- `id`, `store_id`
- `order_number` (unik, format `MNT-YYMMDD-XXXX`, dibuat di service)
- `public_token` (unik, untuk halaman status pelanggan)
- `mode` (`dine_in`, `takeaway`, `delivery`)
- `status` (lihat `04-BUSINESS-RULES.md`)
- `table_id` (nullable, snapshot `table_number` di kolom terpisah)
- `table_number` (snapshot, nullable)
- `customer_name`, `customer_phone` (snapshot, tanpa normalisasi ke tabel pelanggan)
- `delivery_address` (nullable), `delivery_latitude`, `delivery_longitude`, `delivery_distance_km` (nullable)
- `delivery_zone_id` (nullable, FK), `delivery_zone_name` (snapshot)
- `subtotal` (semua item, integer)
- `eligible_subtotal` (item yang memenuhi ambang, integer)
- `delivery_fee` (integer)
- `delivery_discount` (integer)
- `total` (integer)
- `min_item_price_snapshot` (ambang yang dipakai saat transaksi)
- `pickup_note` (nullable)
- `expires_at` (nullable, hanya untuk `PENDING_PAYMENT`)
- `paid_at`, `completed_at` (nullable)
- Index: `status`, `(status, expires_at)`, `paid_at`, `public_token` (unik), `order_number` (unik)

**order_items**
- `id`, `order_id` (FK, cascade)
- `product_id` (nullable, FK, `nullOnDelete`), `product_name` (snapshot)
- `size_name`, `temperature_name` (snapshot, nullable)
- `base_price` (snapshot), `variant_delta` (snapshot)
- `addons_total` (snapshot jumlah add-on per unit)
- `discount_amount` (promo per unit, nullable)
- `unit_price` (harga final per unit: base + variant + addons - discount)
- `qty`
- `line_total` (unit_price × qty)
- `is_delivery_eligible` (boolean, berdasarkan unit_price ≥ ambang)
- `note` (nullable)

**order_item_addons**
- `id`, `order_item_id` (FK, cascade), `addon_id` (nullable, FK, `nullOnDelete`), `addon_name` (snapshot), `price_delta` (snapshot)

**order_status_logs**
- `id`, `order_id` (FK, cascade), `from_status` (nullable), `to_status`, `actor_type` (`system`, `user`, `webhook`), `actor_id` (nullable, ID user admin atau barista), `note` (nullable), `created_at`
- Hanya insert, tidak pernah update atau delete.

**payments**
- `id`, `order_id` (FK), `gateway` (`midtrans` atau `xendit`), `gateway_transaction_id` (unik per gateway), `payment_method` (qris, gopay, bca_va, dsb.), `amount` (integer), `status` (`pending`, `settled`, `failed`, `expired`), `raw_payload` (JSONB), `signature_valid` (boolean), `received_at`, `processed_at` (nullable)
- Index unik `(gateway, gateway_transaction_id)` untuk idempotensi.

**webhook_events** (opsional, untuk audit dan deteksi duplikat)
- `id`, `gateway`, `event_id` (unik), `payload` (JSONB), `received_at`, `processed_at`, `result` (`processed`, `duplicate`, `rejected`, `late_after_expired`)

### 2.7 Pengguna Admin
**users** (Breeze)
- Tambahan: `role` (`admin` atau `barista`, default `barista`), `is_active` (boolean)

## 3. Relasi Ringkas

```
categories 1─* products 1─* product_variants
products *─* addon_groups (via product_addon_group) 1─* addons
carts 1─* cart_items *─* addons (via cart_item_addons)
orders 1─* order_items 1─* order_item_addons
orders 1─* order_status_logs
orders 1─* payments
tables 1─* orders (opsional)
delivery_zones 1─* delivery_fee_rules
```

## 4. Hal yang Tidak Boleh Dilakukan

- Menghapus `orders`, `order_items`, `payments`, atau `order_status_logs`.
- Membuat relasi FK dari `order_items` langsung ke harga produk. Harga selalu disalin sebagai snapshot.
- Menyimpan uang sebagai `float` atau `decimal`.
- Menaruh logika harga di migrasi atau seeder.
