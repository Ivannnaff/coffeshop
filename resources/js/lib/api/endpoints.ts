import { client } from './client';
import {
    Cart,
    Category,
    CheckoutPreview,
    Order,
    Payment,
    Product,
    ReorderResult,
} from './types';

export const api = {
    getMenu(): Promise<Category[]> {
        return client.get<Category[]>('/menu');
    },
    searchMenu(query: string): Promise<Product[]> {
        return client.get<Product[]>(`/menu/search?q=${encodeURIComponent(query)}`);
    },
    getCart(): Promise<Cart> {
        return client.get<Cart>('/cart');
    },
    addCartItem(data: {
        product_id: number;
        variant_ids?: number[];
        addon_ids?: number[];
        qty: number;
        note?: string | null;
    }): Promise<Cart> {
        return client.post<Cart>('/cart/items', data);
    },
    updateCartItem(cartItemId: number, data: { qty?: number; note?: string | null }): Promise<Cart> {
        return client.patch<Cart>(`/cart/items/${cartItemId}`, data);
    },
    removeCartItem(cartItemId: number): Promise<Cart> {
        return client.delete<Cart>(`/cart/items/${cartItemId}`);
    },
    updateMode(mode: 'takeaway' | 'delivery'): Promise<{ mode: string }> {
        return client.post<{ mode: string }>('/mode', { mode });
    },
    previewCheckout(data: {
        mode: string;
        latitude?: number | null;
        longitude?: number | null;
    }): Promise<CheckoutPreview> {
        return client.post<CheckoutPreview>('/checkout/preview', data);
    },
    checkout(data: {
        customer_name: string;
        customer_phone: string;
        mode: string;
        pickup_note?: string | null;
        delivery?: {
            address: string;
            latitude: number;
            longitude: number;
        } | null;
    }): Promise<Order> {
        return client.post<Order>('/checkout', data);
    },
    getOrder(publicToken: string): Promise<Order> {
        return client.get<Order>(`/orders/${publicToken}`);
    },
    retryPayment(publicToken: string): Promise<Payment> {
        return client.post<Payment>(`/orders/${publicToken}/payment`);
    },
    async reorder(publicToken: string): Promise<ReorderResult> {
        const json = await client.raw('POST', `/orders/${publicToken}/reorder`);
        return {
            cart: json.data as Cart,
            skipped_items: Array.isArray(json.skipped_items) ? (json.skipped_items as string[]) : [],
        };
    },
};
