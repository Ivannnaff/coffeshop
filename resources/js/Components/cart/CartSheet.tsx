import { Link } from '@inertiajs/react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Sheet } from '@/Components/ui/Sheet';
import { Button } from '@/Components/ui/Button';
import { QtyStepper } from '@/Components/ui/QtyStepper';
import { ModeBar } from '@/Components/ui/ModeBar';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { EmptyState } from '@/Components/ui/EmptyState';
import { useCart } from '@/Context/CartContext';
import { CartItemExtras } from '@/Components/cart/CartItemExtras';
import { formatRupiah } from '@/lib/format/currency';
import { formatAddons } from '@/lib/utils';
import { cn } from '@/lib/cn';
import type { CartItem, OrderMode } from '@/types';

const MODE_LABEL: Record<OrderMode, string> = {
    dine_in: 'Makan di tempat',
    takeaway: 'Bawa pulang',
    delivery: 'Diantar',
};

export function CartSheet() {
    const { cart, itemCount, isOpen, closeCart, updateQty, removeItem, changeMode, pending } =
        useCart();
    const locked = cart.mode === 'dine_in';
    const remainingForDelivery = Math.max(0, cart.min_item_price - cart.eligible_subtotal);

    return (
        <Sheet
            open={isOpen}
            onClose={closeCart}
            title="Keranjang"
            subtitle={
                itemCount > 0 ? `${itemCount} item · ${MODE_LABEL[cart.mode]}` : 'Belum ada item'
            }
            footer={
                cart.items.length > 0 ? (
                    <div className="space-y-2 pb-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-ink-muted text-[13px]">Subtotal</span>
                            <span className="leader" aria-hidden="true" />
                            <span className="tabular text-ink text-[18px] font-semibold">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </div>
                        <Link href="/checkout" onClick={closeCart} className="block">
                            <Button size="lg" fullWidth>
                                Lanjut ke pembayaran
                            </Button>
                        </Link>
                    </div>
                ) : undefined
            }
        >
            {cart.items.length === 0 ? (
                <EmptyState
                    icon={<ShoppingBag className="size-6" />}
                    title="Keranjang masih kosong"
                    description="Yuk pilih kopi favoritmu dulu, pesanan akan muncul di sini."
                    action={
                        <Link href="/">
                            <Button variant="outline" onClick={closeCart}>
                                Lihat menu
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="space-y-4">
                    <div>
                        <ModeBar mode={cart.mode} onChange={changeMode} locked={locked} />
                        {locked && (
                            <p className="text-ink-muted mt-2 text-[11.5px]">
                                Mode makan di tempat mengikuti meja yang kamu pindai.
                            </p>
                        )}
                    </div>

                    {cart.has_unavailable_items && (
                        <p className="border-danger/30 bg-danger-soft/50 text-danger border px-3.5 py-2.5 text-xs font-medium">
                            Sebagian item tidak tersedia untuk mode pesanan ini. Hapus atau ubah
                            jumlahnya sebelum melanjutkan.
                        </p>
                    )}

                    <ul className="border-line border-t border-dashed">
                        {cart.items.map((item) => (
                            <CartRow
                                key={item.id}
                                item={item}
                                pending={pending}
                                onQtyChange={(qty) => updateQty(item.id, qty)}
                                onRemove={() => removeItem(item.id)}
                            />
                        ))}
                    </ul>

                    {cart.mode === 'delivery' && remainingForDelivery > 0 && (
                        <p className="border-warning/30 bg-warning-soft/60 text-warning border px-3.5 py-2.5 text-xs font-medium">
                            Tambah {formatRupiah(remainingForDelivery)} lagi agar pesananmu memenuhi
                            minimal belanja antar.
                        </p>
                    )}
                </div>
            )}
        </Sheet>
    );
}

function CartRow({
    item,
    pending,
    onQtyChange,
    onRemove,
}: {
    item: CartItem;
    pending: boolean;
    onQtyChange: (qty: number) => void;
    onRemove: () => void;
}) {
    const details = [item.size_name, item.temperature_name].filter(Boolean).join(' · ');
    const addons = formatAddons(item.addons);

    return (
        <li
            className={cn(
                'border-line border-b border-dashed py-3.5 last:border-0',
                !item.is_available && 'text-danger',
            )}
        >
            <div className="flex gap-3">
                <div className="border-line/80 bg-canvas-deep size-16 shrink-0 overflow-hidden rounded-lg border">
                    <CoffeeArt seed={item.product_name} compact />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-ink truncate text-sm font-semibold">
                                {item.product_name}
                            </p>
                            {details && <p className="text-ink-muted text-[11.5px]">{details}</p>}
                            {addons && <p className="text-ink-muted text-[11.5px]">{addons}</p>}
                            {item.note && (
                                <p className="text-ink-muted mt-0.5 line-clamp-1 text-[11.5px] italic">
                                    “{item.note}”
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={pending}
                            aria-label={`Hapus ${item.product_name}`}
                            className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-8 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40"
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                        <span className="tabular text-ink text-sm font-semibold">
                            {formatRupiah(item.line_total)}
                        </span>
                        <QtyStepper
                            size="sm"
                            value={item.qty}
                            loading={pending}
                            onDecrease={() => onQtyChange(item.qty - 1)}
                            onIncrease={() => onQtyChange(item.qty + 1)}
                        />
                    </div>

                    {!item.is_available && item.unavailable_reason && (
                        <p className="text-danger mt-1.5 text-[11px] font-medium">
                            {item.unavailable_reason}
                        </p>
                    )}
                </div>
            </div>

            <CartItemExtras item={item} />
        </li>
    );
}
