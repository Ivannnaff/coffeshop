import axios from 'axios';
import type { OrderMode } from '@/types';

const client = axios.create({
    baseURL: '/kasir',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export interface CashierOrderPayload {
    mode: Exclude<OrderMode, 'delivery'>;
    table_id: number | null;
    customer_name: string | null;
    pickup_note: string | null;
    items: {
        product_id: number;
        variant_ids: number[];
        addon_ids: number[];
        qty: number;
        note: string | null;
    }[];
}

export interface CashierOrderResult {
    id: number;
    order_number: string;
    public_token: string;
    total: number;
    status: string;
}

export async function createCashierOrder(
    payload: CashierOrderPayload,
): Promise<CashierOrderResult> {
    const response = await client.post<{ data: CashierOrderResult }>('/orders', payload);

    return response.data.data;
}
