export type OrderMode = 'dine_in' | 'takeaway' | 'delivery';

export type ProductBadge = 'promo' | 'best_seller';

export type VariantType = 'size' | 'temperature';

export type AddonSelectionType = 'single' | 'multiple';

export interface ProductVariant {
    id: number;
    product_id: number;
    type: VariantType;
    name: string;
    price_delta: number;
    is_default: boolean;
    sort_order: number;
}

export interface Addon {
    id: number;
    addon_group_id: number;
    name: string;
    price_delta: number;
    is_sold_out: boolean;
    is_active: boolean;
    sort_order: number;
}

export interface AddonGroup {
    id: number;
    name: string;
    selection_type: AddonSelectionType;
    min_select: number;
    max_select: number;
    is_active: boolean;
    addons: Addon[];
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    base_price: number;
    image_path: string | null;
    is_sold_out: boolean;
    is_active: boolean;
    badge: ProductBadge | null;
    sort_order: number;
    variants: ProductVariant[];
    addon_groups: AddonGroup[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    products: Product[];
}

export interface CartAddon {
    id: number;
    name: string;
    price_delta: number;
}

export interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    size_name: string | null;
    temperature_name: string | null;
    addons: CartAddon[];
    unit_price: number;
    qty: number;
    line_total: number;
    is_delivery_eligible: boolean;
    is_available: boolean;
    unavailable_reason: string | null;
    note: string | null;
}

export interface Cart {
    token: string;
    mode: OrderMode;
    items: CartItem[];
    has_unavailable_items: boolean;
    subtotal: number;
    eligible_subtotal: number;
    min_item_price: number;
}

export interface Store {
    id: number;
    store_id: number;
    name: string;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    opening_time: string | null;
    closing_time: string | null;
    timezone: string;
    is_accepting_orders: boolean;
    payment_expiry_minutes: number;
    delivery_min_item_price: number;
}

export interface TableInfo {
    id: number;
    number: string;
}

export interface Payment {
    gateway: string;
    status: 'pending' | 'settled' | 'failed' | 'expired';
    amount: number;
    payment_method: string | null;
    redirect_url: string | null;
    token: string | null;
}

export interface OrderItem {
    product_name: string;
    size_name: string | null;
    temperature_name: string | null;
    addons: CartAddon[];
    unit_price: number;
    qty: number;
    line_total: number;
    is_delivery_eligible: boolean;
    note: string | null;
}

export interface Order {
    order_number: string;
    public_token: string;
    status: string;
    mode: OrderMode;
    table_number: string | null;
    customer_name: string;
    delivery_address: string | null;
    delivery_zone_name: string | null;
    version: number | null;
    items: OrderItem[];
    subtotal: number;
    eligible_subtotal: number;
    delivery_fee: number;
    delivery_discount: number;
    total: number;
    min_item_price_snapshot: number;
    pickup_note: string | null;
    expires_at: string | null;
    paid_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    payment: Payment | null;
}

export interface CheckoutPreview {
    subtotal: number;
    eligible_subtotal: number;
    delivery_fee: number;
    delivery_discount: number;
    total: number;
    zone_id: number | null;
    zone_name: string | null;
    distance_km: number | null;
    min_item_price: number;
}

export interface ReorderResult {
    cart: Cart;
    skipped_items: string[];
}
