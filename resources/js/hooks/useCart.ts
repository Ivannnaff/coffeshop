import { useCallback, useState } from 'react';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { Cart, OrderMode } from '@/lib/api/types';

export function useCart(initialCart: Cart) {
    const [cart, setCart] = useState<Cart>(initialCart);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);

    const run = useCallback(async (action: () => Promise<Cart>): Promise<Cart | null> => {
        setPending(true);
        setError(null);
        try {
            const next = await action();
            setCart(next);
            return next;
        } catch (caught) {
            setError(caught instanceof ApiError ? caught : new ApiError({
                status: 0,
                code: 'UNEXPECTED_ERROR',
                message: 'Terjadi kesalahan.',
            }));
            return null;
        } finally {
            setPending(false);
        }
    }, []);

    const addItem = useCallback(
        (payload: {
            product_id: number;
            variant_ids?: number[];
            addon_ids?: number[];
            qty: number;
            note?: string | null;
        }) => run(() => api.addCartItem(payload)),
        [run],
    );

    const updateQty = useCallback(
        (cartItemId: number, qty: number) => run(() => api.updateCartItem(cartItemId, { qty })),
        [run],
    );

    const updateNote = useCallback(
        (cartItemId: number, note: string | null) =>
            run(() => api.updateCartItem(cartItemId, { note })),
        [run],
    );

    const removeItem = useCallback(
        (cartItemId: number) => run(() => api.removeCartItem(cartItemId)),
        [run],
    );

    const updateMode = useCallback(
        async (mode: Exclude<OrderMode, 'dine_in'>) => {
            setPending(true);
            setError(null);
            try {
                await api.updateMode(mode);
                const next = await api.getCart();
                setCart(next);
                return next;
            } catch (caught) {
                setError(caught instanceof ApiError ? caught : null);
                return null;
            } finally {
                setPending(false);
            }
        },
        [],
    );

    const refresh = useCallback(async () => {
        const next = await run(() => api.getCart());
        return next;
    }, [run]);

    return {
        cart,
        setCart,
        pending,
        error,
        addItem,
        updateQty,
        updateNote,
        removeItem,
        updateMode,
        refresh,
        clearError: () => setError(null),
    };
}
