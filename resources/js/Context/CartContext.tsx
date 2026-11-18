import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    addCartItem,
    fetchCart,
    removeCartItem,
    updateCartItem,
    updateOrderMode,
} from '@/lib/api/endpoints';
import { toApiError } from '@/lib/api/client';
import { useToast } from '@/Context/ToastContext';
import type { AddCartItemPayload, Cart, OrderMode } from '@/types';

const EMPTY_CART: Cart = {
    token: '',
    mode: 'takeaway',
    items: [],
    subtotal: 0,
    eligible_subtotal: 0,
    min_item_price: 0,
    has_unavailable_items: false,
};

interface CartContextValue {
    cart: Cart;
    itemCount: number;
    pending: boolean;
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addItem: (payload: AddCartItemPayload) => Promise<Cart | null>;
    updateQty: (itemId: number, qty: number) => Promise<void>;
    updateItemOptions: (
        itemId: number,
        addons: { addon_id: number; qty: number }[],
    ) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    changeMode: (mode: OrderMode) => Promise<void>;
    refresh: () => Promise<void>;
    syncCart: (cart: Cart | null | undefined) => void;
    reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
    children,
    initialCart,
}: {
    children: ReactNode;
    initialCart?: Cart | null;
}) {
    const [cart, setCart] = useState<Cart>(initialCart ?? EMPTY_CART);
    const [pending, setPending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const toast = useToast();

    const itemCount = useMemo(
        () => cart.items.reduce((sum, item) => sum + item.qty, 0),
        [cart.items],
    );

    const run = useCallback(
        async (operation: () => Promise<Cart>): Promise<Cart | null> => {
            setPending(true);
            try {
                const next = await operation();
                setCart(next);
                return next;
            } catch (error) {
                toast.push(toApiError(error).message, 'error');
                return null;
            } finally {
                setPending(false);
            }
        },
        [toast],
    );

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    const addItem = useCallback(
        async (payload: AddCartItemPayload) => {
            const next = await run(() => addCartItem(payload));
            if (next) {
                toast.push('Ditambahkan ke keranjang');
            }
            return next;
        },
        [run, toast],
    );

    const updateQty = useCallback(
        async (itemId: number, qty: number) => {
            if (qty < 1) return;
            await run(() => updateCartItem(itemId, { qty }));
        },
        [run],
    );

    const updateItemOptions = useCallback(
        async (itemId: number, addons: { addon_id: number; qty: number }[]) => {
            await run(() => updateCartItem(itemId, { addons }));
        },
        [run],
    );

    const removeItem = useCallback(
        async (itemId: number) => {
            await run(() => removeCartItem(itemId));
        },
        [run],
    );

    const changeMode = useCallback(
        async (mode: OrderMode) => {
            if (mode === cart.mode || cart.mode === 'dine_in') return;

            const previous = cart.mode;
            setCart((current) => ({ ...current, mode }));

            try {
                await updateOrderMode(mode as Exclude<OrderMode, 'dine_in'>);
                const next = await fetchCart();
                setCart(next);
            } catch (error) {
                setCart((current) => ({ ...current, mode: previous }));
                toast.push(toApiError(error).message, 'error');
            }
        },
        [cart.mode, toast],
    );

    const refresh = useCallback(async () => {
        await run(() => fetchCart());
    }, [run]);

    const syncCart = useCallback((next: Cart | null | undefined) => {
        if (next) {
            setCart(next);
        }
    }, []);

    const reset = useCallback(() => setCart(EMPTY_CART), []);

    const value = useMemo<CartContextValue>(
        () => ({
            cart,
            itemCount,
            pending,
            isOpen,
            openCart,
            closeCart,
            addItem,
            updateQty,
            updateItemOptions,
            removeItem,
            changeMode,
            refresh,
            syncCart,
            reset,
        }),
        [
            cart,
            itemCount,
            pending,
            isOpen,
            openCart,
            closeCart,
            addItem,
            updateQty,
            updateItemOptions,
            removeItem,
            changeMode,
            refresh,
            syncCart,
            reset,
        ],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used inside CartProvider');
    }

    return context;
}
