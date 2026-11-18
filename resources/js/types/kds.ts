import type { Category, OrderItem, OrderMode, OrderStatus, PaymentInfo } from '@/types';

export type StaffRole = 'admin' | 'barista';

export interface StaffUser {
    id: number;
    name: string;
    email: string;
    role: StaffRole;
}

export interface StaffOrder {
    id: number;
    order_number: string;
    public_token: string;
    status: OrderStatus;
    mode: OrderMode;
    table_number: string | null;
    customer_name: string;
    delivery_address: string | null;
    delivery_zone_name: string | null;
    version: number | null;
    items: OrderItem[];
    subtotal: number;
    delivery_fee: number;
    delivery_discount: number;
    total: number;
    pickup_note: string | null;
    paid_at: string | null;
    completed_at: string | null;
    created_at: string;
    expires_at: string | null;
    payment: PaymentInfo | null;
}

export type KdsAction = 'start' | 'ready' | 'complete' | 'dispatch' | 'deliver';

export interface LoginPageProps {
    demo: {
        admin: string;
        barista: string;
        password: string;
    } | null;
}

export interface KdsPageProps {
    staff: StaffUser;
}

export interface KasirTable {
    id: number;
    number: string;
}

export interface KasirPageProps {
    staff: StaffUser;
    categories: Category[];
    tables: KasirTable[];
}
