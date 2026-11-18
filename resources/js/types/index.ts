export type OrderMode = 'dine_in' | 'takeaway' | 'delivery';

export type ProductBadge = 'promo' | 'best_seller';

export type VariantType = 'size' | 'temperature';

export type AddonSelectionType = 'single' | 'multiple';

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'PREPARING'
    | 'READY'
    | 'OUT_FOR_DELIVERY'
    | 'COMPLETED'
    | 'EXPIRED'
    | 'CANCELLED';

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
    image_url?: string | null;
    is_sold_out: boolean;
    is_active: boolean;
    badge: ProductBadge | null;
    sort_order: number;
    category?: Category;
    variants: ProductVariant[];
    addon_groups: AddonGroup[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    products_count?: number;
    products: Product[];
}

export interface CartItemAddon {
    id: number;
    name: string;
    price_delta: number;
    qty: number;
}

export interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    size_name: string | null;
    temperature_name: string | null;
    addons: CartItemAddon[];
    unit_price: number;
    qty: number;
    line_total: number;
    is_delivery_eligible: boolean;
    is_available: boolean;
    unavailable_reason: string | null;
    note: string | null;
    addon_options?: AddonGroup[];
}

export interface Cart {
    token: string;
    mode: OrderMode;
    items: CartItem[];
    subtotal: number;
    eligible_subtotal: number;
    min_item_price: number;
    has_unavailable_items: boolean;
}

export interface StoreInfo {
    id?: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    opening_time?: string | null;
    closing_time?: string | null;
    timezone?: string;
    is_accepting_orders?: boolean;
    payment_expiry_minutes?: number;
    delivery_min_item_price?: number;
}

export interface TableInfo {
    id?: number;
    number: string;
}

export interface SharedPageProps {
    store: StoreInfo | null;
    [key: string]: unknown;
}

export interface MenuPageProps {
    categories: Category[];
    cart: Cart;
    table: TableInfo | null;
    product: Product | null;
    cartOpen: boolean;
}

export interface CheckoutPageProps {
    cart: Cart;
    store: StoreInfo;
    table: TableInfo | null;
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

export interface OrderItemAddon {
    name: string;
    price_delta: number;
    qty: number;
}

export interface OrderItem {
    product_name: string;
    size_name: string | null;
    temperature_name: string | null;
    addons: OrderItemAddon[];
    unit_price: number;
    qty: number;
    line_total: number;
    is_delivery_eligible: boolean;
    note: string | null;
}

export interface PaymentInfo {
    gateway: string;
    status: string;
    amount: number;
    payment_method: string | null;
    redirect_url: string | null;
    token: string | null;
}

export interface PublicOrder {
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
    eligible_subtotal: number;
    delivery_fee: number;
    delivery_discount: number;
    total: number;
    min_item_price_snapshot: number;
    pickup_note: string | null;
    expires_at: string | null;
    paid_at: string | null;
    completed_at: string | null;
    created_at: string;
    payment: PaymentInfo | null;
}

export interface PaymentPageProps {
    order: PublicOrder;
    server_time: string;
}

export interface OrderPageProps {
    order: PublicOrder;
}

export interface AddCartItemPayload {
    product_id: number;
    variant_ids?: number[];
    addon_ids?: number[];
    qty: number;
    note?: string | null;
}

export interface CheckoutPayload {
    customer_name: string;
    customer_phone: string;
    mode: OrderMode;
    pickup_note?: string | null;
    delivery?: {
        address: string;
        latitude: number;
        longitude: number;
    };
}
