# 04 - Aturan Bisnis

Dokumen ini adalah sumber aturan untuk `OrderStatusService`, `PriceCalculator`, dan `DeliveryFeeCalculator`. Jika kode dan dokumen berbeda, dokumen yang benar, dan kodenya harus diperbaiki.

## 1. State Machine Pesanan

### 1.1 Status

| Status | Arti |
|--------|------|
| `PENDING_PAYMENT` | Pesanan dibuat, menunggu pembayaran. Punya `expires_at`. |
| `PAID` | Pembayaran sukses (dari webhook). Masuk antrean KDS. |
| `PREPARING` | Barista mulai membuat. |
| `READY` | Pesanan selesai dibuat. Memicu notifikasi ke layar pelanggan. |
| `OUT_FOR_DELIVERY` | Khusus delivery. Kurir sudah berangkat. |
| `COMPLETED` | Pesanan sudah diambil atau diterima. |
| `EXPIRED` | Pembayaran tidak selesai sampai batas waktu. Status akhir. |

Tidak ada status batal, refund, atau gagal. Keputusan ini final untuk MVP.

### 1.2 Diagram

Dine-in dan takeaway:
```
PENDING_PAYMENT ──▶ PAID ──▶ PREPARING ──▶ READY ──▶ COMPLETED
       │
       ▼
    EXPIRED
```

Delivery:
```
PENDING_PAYMENT ──▶ PAID ──▶ PREPARING ──▶ READY ──▶ OUT_FOR_DELIVERY ──▶ COMPLETED
       │
       ▼
    EXPIRED
```

### 1.3 Transisi yang Diizinkan

| Dari | Ke | Pemicu | Aktor |
|------|----|--------|-------|
| PENDING_PAYMENT | PAID | Webhook sukses | webhook |
| PENDING_PAYMENT | EXPIRED | Scheduler, saat `expires_at` lewat | system |
| PAID | PREPARING | Barista menekan "Mulai" | barista, admin |
| PREPARING | READY | Barista menekan "Selesai dibuat" | barista, admin |
| READY | COMPLETED | Pesanan diambil (dine-in dan takeaway) | barista, admin |
| READY | OUT_FOR_DELIVERY | Kurir berangkat (delivery) | barista, admin |
| OUT_FOR_DELIVERY | COMPLETED | Pesanan diterima pelanggan | admin |

Transisi lain ditolak dengan exception `InvalidOrderTransition`.

### 1.4 Aturan Transisi

- Status hanya maju. Tidak ada kembali ke status sebelumnya.
- Setiap transisi dicatat di `order_status_logs` dalam transaksi yang sama.
- `OUT_FOR_DELIVERY` hanya boleh untuk `mode = delivery`.
- Pesanan `dine_in` dan `takeaway` tidak boleh masuk ke `OUT_FOR_DELIVERY`.
- Setelah `EXPIRED` atau `COMPLETED`, pesanan tidak boleh berubah lagi.

### 1.5 Siapa Menekan COMPLETED untuk Dine-in dan Takeaway

Barista menandai `COMPLETED` saat pelanggan mengambil pesanan di counter. Pesanan yang sudah `READY` tidak otomatis selesai, karena ada risiko pelanggan tidak mengambilnya.

*Catatan: keputusan ini sudah disepakati, tetapi bisa dibuka lagi setelah ada data operasional.*

## 2. Aturan Pembayaran dan Expired

- `expires_at = created_at + payment_expiry_minutes` (default 15 menit).
- Durasi expiry yang dikirim ke gateway harus sama dengan `payment_expiry_minutes`.
- Scheduler berjalan setiap menit dan mengubah pesanan `PENDING_PAYMENT` dengan `expires_at < now()` menjadi `EXPIRED`.
- Webhook sukses yang datang setelah `EXPIRED`:
  - Status tidak diubah.
  - `payments` tetap dicatat dengan `status = settled`.
  - `webhook_events.result = late_after_expired`.
  - Admin menerima notifikasi untuk refund manual lewat dashboard gateway.
- Webhook sukses yang datang untuk pesanan yang sudah `PAID` atau lebih lanjut: idempotensi. Tidak ada perubahan, hanya dicatat sebagai `duplicate`.

## 3. Aturan Harga

### 3.1 Prinsip
- Harga selalu dihitung ulang di server, baik saat menampilkan keranjang maupun saat checkout.
- Client hanya mengirim `product_id`, `variant_id`, `addon_id`, `qty`, dan `note`.
- Nilai uang dari client selalu diabaikan.

### 3.2 Rumus Harga Per Unit

```
unit_price = base_price
           + sum(variant.price_delta)       // size dan temperature
           + sum(addon.price_delta)         // add-on berbayar dan gratis (0)
           - promo_discount_per_unit        // jika ada promo aktif
```

Syarat: `unit_price` tidak boleh negatif. Jika negatif, nilainya di-clamp ke 0 dan dicatat sebagai anomali.

### 3.3 Subtotal dan Total

```
line_total = unit_price × qty
subtotal   = sum(line_total)
```

### 3.4 Ketersediaan Produk

- Produk dengan `is_active = false` atau `deleted_at` terisi tidak bisa dipesan.
- Produk dengan `is_sold_out = true` tidak bisa dipesan.
- Add-on dengan `is_sold_out = true` tidak bisa dipilih.
- Validasi dilakukan saat tambah ke keranjang dan diulang saat checkout.

### 3.5 Validasi Add-on

- Setiap grup add-on pada produk harus memenuhi `min_select` dan `max_select`.
- Grup `single` hanya boleh satu pilihan.
- Add-on harus termasuk grup yang terhubung ke produk tersebut (`product_addon_group`).

## 4. Aturan Ongkir Delivery

### 4.1 Pemilihan Zona
1. Server menghitung jarak garis lurus atau jarak tempuh dari koordinat toko ke koordinat pelanggan (lihat `11-DECISIONS.md` untuk metode yang dipakai).
2. Zona dipilih dari `delivery_zones` (aktif, diurutkan `max_distance_km` naik), yaitu zona pertama dengan `max_distance_km ≥ jarak`.
3. Jika tidak ada zona yang cocok, checkout ditolak dengan pesan bahwa lokasi di luar area pengiriman.

### 4.2 Item yang Memenuhi Syarat Diskon Ongkir

Aturan kunci yang sudah disepakati:

> Item dihitung untuk diskon ongkir jika **harga final per unit ≥ `delivery_min_item_price`** (default Rp15.000). Harga final mencakup base, variant, add-on, dan promo. Qty tidak mempengaruhi status kelayakan.

Contoh:
- 1 Es Kopi Susu Rp14.000 → tidak memenuhi syarat.
- 2 Es Kopi Susu Rp14.000 → tidak memenuhi syarat (dicek per unit, bukan per baris).
- 1 Es Kopi Susu + Extra Shot Rp5.000 = Rp19.000 → memenuhi syarat.

### 4.3 Perhitungan Potongan

```
eligible_subtotal = sum(line_total) untuk item yang is_delivery_eligible = true
```

Qty tetap dihitung dalam `eligible_subtotal`. Hanya kelayakan item yang ditentukan per unit.

Potongan mengikuti `delivery_fee_rules` atau `free_fee_min_subtotal` pada zona:
- Jika `eligible_subtotal ≥ min_eligible_subtotal` dan aturan `free`, ongkir menjadi 0.
- Jika aturan `percent`, potongan = `delivery_fee × discount_value / 100`, dibulatkan ke bawah.

```
delivery_fee     = zone.base_fee
delivery_discount = min(delivery_fee, hasil aturan)
total            = subtotal + delivery_fee - delivery_discount
```

### 4.4 Transparansi di UI

- Checkout menampilkan teks: "Item di bawah Rp15.000 per porsi tidak dihitung untuk potongan ongkir."
- Item yang tidak memenuhi syarat diberi label "tidak termasuk hitungan gratis ongkir".
- Ongkir tidak dihitung di halaman keranjang. Teks yang tampil: "ongkir dihitung saat checkout".

## 5. Aturan Mode Pemesanan

- Dine-in hanya bisa dimulai dari QR meja. `table_id` terkunci di session dan tidak bisa diubah pelanggan.
- Pelanggan di session dine-in tidak bisa beralih ke delivery tanpa keluar dari session meja.
- Takeaway dan delivery dipilih dari halaman utama dan disimpan di session.
- Keranjang tidak terikat mode. Item yang sama dapat dipakai untuk mode apa pun.

## 6. Aturan Operasional

- Pesanan hanya bisa dibuat jika `store_settings.is_accepting_orders = true` dan waktu sekarang berada dalam jam buka (`Asia/Jakarta`).
- Di luar jam buka, halaman menu tetap bisa diakses, tetapi tombol checkout dinonaktifkan dengan pesan yang jelas.
- Nomor pesanan (`order_number`) unik dan dibuat di service, tidak diberikan oleh client.

## 7. Aturan Laporan

- Yang dihitung sebagai penjualan: pesanan berstatus `PAID`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, dan `COMPLETED`.
- Tidak dihitung: `PENDING_PAYMENT` dan `EXPIRED`.
- Pendapatan dihitung dari `total`, bukan dari jumlah pembayaran gateway.
- Filter tanggal memakai `paid_at` dan zona waktu `Asia/Jakarta`.
- Statistik harian di-cache dengan TTL singkat dan di-invalidate saat ada pesanan baru.

## 8. Aturan Audit

- Setiap perubahan status masuk ke `order_status_logs`.
- Perubahan harga produk tidak mengubah pesanan lama, karena pesanan menyimpan snapshot.
- Perubahan pengaturan toko dan zona dicatat di log aplikasi (channel `audit`).
