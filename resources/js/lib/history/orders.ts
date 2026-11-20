import type { OrderStatus } from '@/types';

export interface RecentOrder {
    token: string;
    number: string;
    status: OrderStatus;
    savedAt: number;
}

const STORAGE_KEY = 'menanti.recent-orders';
const MAX_ENTRIES = 10;

export function saveRecentOrder(order: Omit<RecentOrder, 'savedAt'>): void {
    if (typeof window === 'undefined') return;

    try {
        const current = listRecentOrders().filter((item) => item.token !== order.token);
        const next = [{ ...order, savedAt: Date.now() }, ...current].slice(0, MAX_ENTRIES);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Penyimpanan privat / penuh: riwayat tidak dipaksakan.
    }
}

export function listRecentOrders(): RecentOrder[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is RecentOrder =>
                typeof item === 'object' &&
                item !== null &&
                typeof item.token === 'string' &&
                typeof item.number === 'string' &&
                typeof item.status === 'string' &&
                item.status !== '' &&
                typeof item.savedAt === 'number',
        );
    } catch {
        return [];
    }
}

export function clearRecentOrders(): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Abaikan kegagalan penyimpanan.
    }
}
