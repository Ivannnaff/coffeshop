import type { Addon, AddonGroup, Category, Product, ProductVariant } from '@/types';
import type { StaffUser } from '@/types/kds';

export interface AdminPageProps {
    staff: StaffUser;
}

export interface AdminAddonGroup extends Omit<AddonGroup, 'addons'> {
    addons?: Addon[];
}

export interface AdminProduct extends Omit<Product, 'addon_groups'> {
    addon_groups: AdminAddonGroup[];
}

export interface AdminTable {
    id: number;
    store_id: number;
    number: string;
    qr_token: string;
    is_active: boolean;
}

export interface StoreSettings {
    id: number;
    store_id: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    opening_time: string | null;
    closing_time: string | null;
    timezone: string;
    is_accepting_orders: boolean;
    payment_expiry_minutes: number;
    delivery_min_item_price: number;
}

export interface ReportSummary {
    from: string;
    to: string;
    total_revenue: number;
    total_orders: number;
    total_items_sold: number;
    top_products: { name: string; qty: number }[];
}

export interface DeliveryFeeRule {
    id: number;
    delivery_zone_id: number;
    min_eligible_subtotal: number;
    discount_type: 'free' | 'percent';
    discount_value: number | null;
    is_active: boolean;
}

export interface DeliveryZone {
    id: number;
    store_id: number;
    name: string;
    max_distance_km: number;
    base_fee: number;
    free_fee_min_subtotal: number | null;
    sort_order: number;
    is_active: boolean;
    fee_rules: DeliveryFeeRule[];
}

export interface ProductVariantInput {
    type: 'size' | 'temperature';
    name: string;
    price_delta: number;
    is_default: boolean;
    sort_order: number;
}

export type { Addon, AddonGroup, Category, ProductVariant, StaffUser };
