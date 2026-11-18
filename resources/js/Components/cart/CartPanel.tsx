import { Link } from '@inertiajs/react';
import { Coffee, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { QtyStepper } from '@/Components/ui/QtyStepper';
import { ModeBar } from '@/Components/ui/ModeBar';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { useCart } from '@/Context/CartContext';
import { CartItemExtras } from '@/Components/cart/CartItemExtras';
import { formatRupiah } from '@/lib/format/currency';
import { formatAddons } from '@/lib/utils';

export function CartPanel() {
    const { cart, itemCount, updateQty, removeItem, changeMode, pending } = useCart();
    const locked = cart.mode === 'dine_in';
    const remainingForDelivery = Math.max(0, cart.min_item_price - cart.eligible_subtotal);

    return (
        <aside className="border-line bg-surface rounded-[14px] border p-5">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-ink text-[20px]">Pesananmu</h2>
                <span className="border-line text-ink-muted tabular rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold">
                    {itemCount} item
                </span>
            </div>

            <div className="mt-3">
                <ModeBar mode={cart.mode} onChange={changeMode} locked={locked} />
            </div>

            <div className="border-line mt-4 border-t border-dashed" />

            {cart.items.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                    <span className="border-line text-brand mb-3 grid size-12 place-items-center rounded-full border">
                        <Coffee className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-ink text-sm font-semibold">Belum ada pesanan</p>
                    <p className="text-ink-muted mt-1 max-w-[220px] text-xs leading-relaxed">
                        Pilih kopi favoritmu, nanti ringkasannya muncul di sini.
                    </p>
                    <Link href="/#menu" className="mt-4">
                        <Button variant="outline" size="sm">
                            Lihat menu
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    {cart.has_unavailable_items && (
                        <p className="border-danger/30 bg-danger-soft/50 text-danger mt-3 border px-3 py-2 text-[11.5px] font-medium">
                            Ada item yang tidak tersedia untuk mode ini.
                        </p>
                    )}

                    <ul className="mt-1 max-h-[42vh] overflow-y-auto pr-1">
                        {cart.items.map((item) => (
                            <li
                                key={item.id}
                                className="border-line border-b border-dashed py-3.5 last:border-0"
                            >
                                <div className="flex gap-3">
                                    <div className="border-line/80 bg-canvas-deep size-14 shrink-0 overflow-hidden rounded-lg border">
                                        <CoffeeArt seed={item.product_name} compact />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-ink truncate text-[13px] font-semibold">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-ink-muted text-[11px]">
                                                    {[item.size_name, item.temperature_name]
                                                        .filter(Boolean)
                                                        .join(' · ') || 'Regular'}
                                                    {item.addons.length > 0 &&
                                                        ` · ${formatAddons(item.addons)}`}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                disabled={pending}
                                                aria-label={`Hapus ${item.product_name}`}
                                                className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-7 shrink-0 place-items-center rounded-md transition-colors"
                                            >
                                                <Trash2 className="size-3.5" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <QtyStepper
                                                size="sm"
                                                value={item.qty}
                                                loading={pending}
                                                onDecrease={() => updateQty(item.id, item.qty - 1)}
                                                onIncrease={() => updateQty(item.id, item.qty + 1)}
                                            />
                                            <span className="tabular text-ink text-[13px] font-semibold">
                                                {formatRupiah(item.line_total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <CartItemExtras item={item} />
                            </li>
                        ))}
                    </ul>

                    <div className="border-line mt-4 border-t border-dashed pt-4">
                        <div className="flex items-baseline gap-2 text-[13px]">
                            <span className="text-ink-muted">Subtotal</span>
                            <span className="leader" aria-hidden="true" />
                            <span className="tabular text-ink text-[18px] font-semibold">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </div>

                        {cart.mode === 'delivery' && remainingForDelivery > 0 && (
                            <p className="border-warning/30 bg-warning-soft/60 text-warning mt-2 border px-3 py-2 text-[11px] font-medium">
                                Tambah {formatRupiah(remainingForDelivery)} untuk minimal belanja
                                antar.
                            </p>
                        )}

                        <Link href="/checkout" className="mt-3 block">
                            <Button size="lg" fullWidth>
                                <ShoppingBag className="size-4" aria-hidden="true" />
                                Lanjut ke pembayaran
                            </Button>
                        </Link>
                        <p className="text-ink-muted mt-2 text-center text-[10.5px]">
                            Harga sudah termasuk pajak.
                        </p>
                    </div>
                </>
            )}
        </aside>
    );
}
