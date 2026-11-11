import { describe, it, expect } from 'vitest';
import { formatRupiah } from '../format/currency';
import { validatePhone, toLocalPhone, normalizePhone } from '../validation/phone';
import { getErrorMessage } from '../errors/messages';
import { getProgressSteps, getCurrentStep } from '../order/progress';

describe('currency formatter', () => {
    it('formats rupiah correctly', () => {
        expect(formatRupiah(14000)).toBe('Rp14.000');
        expect(formatRupiah(0)).toBe('Rp0');
        expect(formatRupiah(1500000)).toBe('Rp1.500.000');
    });
});

describe('phone validation', () => {
    it('normalizes and validates phone numbers', () => {
        expect(normalizePhone('0812-3456 (7890)')).toBe('081234567890');
        expect(toLocalPhone('6281234567890')).toBe('081234567890');
        expect(validatePhone('081234567890')).toBeNull();
        expect(validatePhone('6281234567890')).toBeNull();
        expect(validatePhone('12345')).not.toBeNull();
    });
});

describe('error messages', () => {
    it('maps error codes correctly', () => {
        expect(getErrorMessage('VALIDATION_FAILED')).toContain('tidak valid');
        expect(getErrorMessage('STORE_CLOSED')).toContain('tutup');
        expect(getErrorMessage('UNKNOWN_CODE', 'Custom fallback')).toBe('Custom fallback');
    });
});

describe('order progress', () => {
    it('returns correct steps and current step', () => {
        const deliverySteps = getProgressSteps('delivery');
        expect(deliverySteps).toHaveLength(5);
        expect(deliverySteps[3].label).toBe('Sedang diantar');

        const takeawaySteps = getProgressSteps('takeaway');
        expect(takeawaySteps[3].label).toBe('Siap diambil');

        expect(getCurrentStep('PENDING_PAYMENT', 'takeaway')).toBe(1);
        expect(getCurrentStep('PREPARING', 'takeaway')).toBe(3);
        expect(getCurrentStep('READY', 'takeaway')).toBe(4);
        expect(getCurrentStep('COMPLETED', 'takeaway')).toBe(5);
    });
});
