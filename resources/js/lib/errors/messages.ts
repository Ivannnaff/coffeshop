export function getErrorMessage(code: string, fallback?: string): string {
    switch (code) {
        case 'VALIDATION_FAILED':
            return 'Data yang Anda masukkan tidak valid. Periksa kembali form di atas.';
        case 'PRODUCT_UNAVAILABLE':
            return 'Sebagian produk atau add-on yang Anda pilih sudah habis.';
        case 'ADDON_INVALID':
            return 'Pilihan tambahan (add-on) belum sesuai dengan ketentuan.';
        case 'OUT_OF_DELIVERY_AREA':
            return 'Lokasi pengiriman berada di luar jangkauan area layanan kami.';
        case 'STORE_CLOSED':
            return 'Toko sedang tutup atau belum menerima pesanan.';
        case 'CART_EXPIRED':
            return 'Keranjang belanja sudah kedaluwarsa. Silakan muat ulang halaman.';
        case 'INVALID_TRANSITION':
            return 'Status pesanan tidak mengizinkan tindakan tersebut.';
        case 'PAYMENT_GATEWAY_ERROR':
            return 'Gagal memproses pembayaran dengan penyedia layanan. Silakan coba lagi.';
        case 'RATE_LIMITED':
            return 'Terlalu banyak permintaan. Mohon tunggu sebentar sebelum mencoba kembali.';
        case 'ORDER_NOT_FOUND':
            return 'Pesanan tidak ditemukan atau token akses tidak valid.';
        default:
            return fallback || 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.';
    }
}
