import axios from 'axios';
import type { KdsAction, StaffOrder } from '@/types/kds';

const client = axios.create({
    baseURL: '/kds',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export async function fetchKdsOrders(): Promise<StaffOrder[]> {
    const response = await client.get<{ data: StaffOrder[] }>('/orders');

    return response.data.data;
}

export async function transitionOrder(
    orderId: number,
    action: KdsAction,
    version: number | null,
): Promise<StaffOrder> {
    const response = await client.post<{ data: StaffOrder }>(`/orders/${orderId}/${action}`, {
        version: version ?? 0,
    });

    return response.data.data;
}
