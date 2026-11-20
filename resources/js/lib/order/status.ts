import type { OrderStatus } from '@/types';

interface StatusMeta {
    label: string;
    tone: 'pending' | 'success' | 'progress' | 'muted' | 'danger';
}

const META: Record<OrderStatus, StatusMeta> = {
    PENDING_PAYMENT: { label: 'Menunggu pembayaran', tone: 'pending' },
    PAID: { label: 'Pembayaran diterima', tone: 'success' },
    PREPARING: { label: 'Sedang disiapkan', tone: 'progress' },
    READY: { label: 'Siap diambil', tone: 'progress' },
    OUT_FOR_DELIVERY: { label: 'Sedang diantar', tone: 'progress' },
    COMPLETED: { label: 'Selesai', tone: 'success' },
    EXPIRED: { label: 'Kedaluwarsa', tone: 'muted' },
    CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
};

export function statusMeta(status: OrderStatus): StatusMeta {
    return META[status] ?? { label: status, tone: 'muted' };
}

export function isAwaitingPayment(status: OrderStatus): boolean {
    return status === 'PENDING_PAYMENT';
}

export function isClosed(status: OrderStatus): boolean {
    return status === 'COMPLETED' || status === 'EXPIRED' || status === 'CANCELLED';
}

export function timelineFor(status: OrderStatus, mode: string): StoreStep[] {
    const steps: StoreStep[] = [
        { key: 'PENDING_PAYMENT', label: 'Pembayaran' },
        { key: 'PAID', label: 'Dikonfirmasi' },
        { key: 'PREPARING', label: 'Disiapkan' },
        {
            key: mode === 'delivery' ? 'OUT_FOR_DELIVERY' : 'READY',
            label: mode === 'delivery' ? 'Diantar' : 'Siap',
        },
        { key: 'COMPLETED', label: 'Selesai' },
    ];

    const order = steps.map((step) => step.key);
    const current = order.indexOf(status);

    if (current === -1) {
        return steps.map((step) => ({ ...step, state: 'upcoming' }));
    }

    return steps.map((step, index) => ({
        ...step,
        state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
    }));
}

export interface StoreStep {
    key: OrderStatus;
    label: string;
    state?: 'done' | 'current' | 'upcoming';
}

export const toneClasses: Record<StatusMeta['tone'], string> = {
    pending: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
    progress: 'bg-brand-soft text-brand',
    muted: 'bg-canvas-deep text-ink-muted',
    danger: 'bg-danger-soft text-danger',
};
