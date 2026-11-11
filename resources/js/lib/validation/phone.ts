/**
 * Nomor WhatsApp Indonesia. Spasi, tanda hubung, dan tanda kurung diabaikan.
 * Nomor berawalan 62 dinormalisasi ke 08 agar cocok dengan validasi backend.
 */
export function normalizePhone(input: string): string {
    return input.replace(/[\s\-().]/g, '');
}

export function toLocalPhone(input: string): string {
    const phone = normalizePhone(input);
    return phone.startsWith('62') ? `0${phone.slice(2)}` : phone;
}

export function validatePhone(input: string): string | null {
    const phone = normalizePhone(input);

    if (phone === '') {
        return 'Nomor WhatsApp wajib diisi.';
    }

    if (!/^(0|62)\d{8,14}$/.test(phone)) {
        return 'Masukkan nomor WhatsApp yang valid, misalnya 081234567890.';
    }

    if (!/^08\d{8,13}$/.test(toLocalPhone(phone))) {
        return 'Nomor WhatsApp harus diawali 08 atau 62 dan berisi 10 sampai 15 digit.';
    }

    return null;
}
