import { Cart } from '@/lib/api/types';
import { Button } from '@/Components/ui/Button';
import { formatRupiah } from '@/lib/format/currency';
import { CartLine } from './CartLine';

interface CartContentsProps {
    cart: Cart;
    onUpdateQty: (cartItemId: number, qty: number) => Promise<unknown>;
    onRemove: (cartItemId: number) => Promise<unknown>;
    onCheckout: () => void;
}

export function CartContents({ cart, onUpdateQty, onRemove, onCheckout }: CartContentsProps) {
    const isEmpty = cart.items.length === 0;

    if (isEmpty) {
        return (
            <div className="py-10 text-center">
                <p className="text-[15px] text-ink-muted">Keranjang masih kosong. Pilih menu untuk memulai.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {cart.items.map((item) => (
                <CartLine
                    key={item.id}
                    item={item}
                    onUpdateQty={onUpdateQty}
                    onRemove={onRemove}
                />
            ))}

            <div className="mt-2 flex flex-col gap-3 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-muted">Subtotal</span>
                    <span className="tabular text-lg font-semibold text-brand">{formatRupiah(cart.subtotal)}</span>
                </div>
                {cart.mode === 'delivery' && (
                    <p className="text-[13px] text-ink-muted">
                        Ongkir dihitung saat checkout. Item di bawah {formatRupiah(cart.min_item_price)} per
                        porsi tidak dihitung untuk potongan ongkir.
                    </p>
                )}
                {cart.has_unavailable_items && (
                    <p className="text-[13px] font-medium text-danger">
                        Ada item yang tidak tersedia. Hapus atau ganti item tersebut sebelum melanjutkan ke checkout.
                    </p>
                )}
                <Button
                    type="button"
                    disabled={cart.has_unavailable_items}
                    onClick={onCheckout}
                    className="mt-1 w-full"
                >
                    Lanjut ke checkout
                </Button>
            </div>
        </div>
    );
}
