import { Cart } from '@/lib/api/types';
import { Sheet } from '@/Components/ui/Sheet';
import { CartContents } from './CartContents';

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
    cart: Cart;
    onUpdateQty: (cartItemId: number, qty: number) => Promise<unknown>;
    onRemove: (cartItemId: number) => Promise<unknown>;
    onCheckout: () => void;
}

export function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onCheckout }: CartDrawerProps) {
    return (
        <Sheet open={open} onClose={onClose} title="Keranjang Belanja">
            <CartContents cart={cart} onUpdateQty={onUpdateQty} onRemove={onRemove} onCheckout={onCheckout} />
        </Sheet>
    );
}
