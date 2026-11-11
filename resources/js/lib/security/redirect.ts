/**
 * Hanya izinkan pengalihan ke domain Midtrans. URL dari server tetap divalidasi
 * sebelum dipakai sebagai href (lihat 06-KEAMANAN.md bagian 6).
 */
export function safeRedirectUrl(url: string | null): string | null {
    if (!url) return null;

    try {
        const parsed = new URL(url, window.location.origin);
        const allowed =
            parsed.protocol === 'https:' &&
            (parsed.hostname === 'midtrans.com' || parsed.hostname.endsWith('.midtrans.com'));

        return allowed ? parsed.toString() : null;
    } catch {
        return null;
    }
}
