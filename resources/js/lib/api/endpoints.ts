import { api } from '@/lib/api/client';
import type {
    AddCartItemPayload,
    Cart,
    CheckoutPayload,
    CheckoutPreview,
    OrderMode,
    PaymentInfo,
    Product,
    PublicOrder,
} from '@/types';

interface Envelope<T> {
    data: T;
}

export async function fetchCart(): Promise<Cart> {
    const response = await api.get<Envelope<Cart>>('/cart');

    return response.data.data;
}

export async function addCartItem(payload: AddCartItemPayload): Promise<Cart> {
    const response = await api.post<Envelope<Cart>>('/cart/items', payload);

    return response.data.data;
}

export async function updateCartItem(
    itemId: number,
    payload: {
        qty?: number;
        note?: string | null;
        variant_ids?: number[];
        addon_ids?: number[];
        addons?: { addon_id: number; qty: number }[];
    },
): Promise<Cart> {
    const response = await api.patch<Envelope<Cart>>(`/cart/items/${itemId}`, payload);

    return response.data.data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
    const response = await api.delete<Envelope<Cart>>(`/cart/items/${itemId}`);

    return response.data.data;
}

export async function updateOrderMode(mode: Exclude<OrderMode, 'dine_in'>): Promise<void> {
    await api.post('/mode', { mode });
}

export async function fetchCheckoutPreview(payload: {
    mode: OrderMode;
    latitude?: number;
    longitude?: number;
}): Promise<CheckoutPreview> {
    const response = await api.post<Envelope<CheckoutPreview>>('/checkout/preview', payload);

    return response.data.data;
}

export interface CheckoutResult {
    order_number: string;
    public_token: string;
    status: string;
    total: number;
}

export async function createOrder(payload: CheckoutPayload): Promise<CheckoutResult> {
    const response = await api.post<Envelope<CheckoutResult>>('/checkout', payload);

    return response.data.data;
}

export async function fetchOrder(token: string): Promise<PublicOrder> {
    const response = await api.get<Envelope<PublicOrder>>(`/orders/${token}`);

    return response.data.data;
}

export async function retryPayment(token: string): Promise<PaymentInfo> {
    const response = await api.post<Envelope<PaymentInfo>>(`/orders/${token}/payment`);

    return response.data.data;
}

export async function reorder(token: string): Promise<{ cart: Cart; skipped: string[] }> {
    const response = await api.post<{ data: Cart; skipped_items: string[] }>(
        `/orders/${token}/reorder`,
    );

    return { cart: response.data.data, skipped: response.data.skipped_items ?? [] };
}

export async function searchMenu(query: string): Promise<Product[]> {
    const response = await api.get<Envelope<Product[]>>('/menu/search', {
        params: { q: query },
    });

    return response.data.data;
}
