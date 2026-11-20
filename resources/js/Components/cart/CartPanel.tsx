import { Link } from '@inertiajs/react';
import { ArrowRight, Coffee, Trash2 } from 'lucide-react';
import { ModeBar } from '@/Components/ui/ModeBar';
import { useCart } from '@/Context/CartContext';
import { CartItemExtras } from '@/Components/cart/CartItemExtras';
import { ProductThumb } from '@/Components/ui/ProductThumb';
import { useStore } from '@/lib/useStore';
import { formatRupiah } from '@/lib/format/currency';
import { formatAddons } from '@/lib/utils';
import type { TableInfo } from '@/types';

export function CartPanel({ table }: { table?: TableInfo | null }) {
    const { cart, itemCount, updateQty, removeItem, changeMode, pending } = useCart();
    const store = useStore();
    const locked = cart.mode === 'dine_in';
    const remainingForDelivery = Math.max(0, cart.min_item_price - cart.eligible_subtotal);
    const orderCode = cart.token ? cart.token.slice(-6).toUpperCase() : 'BARU';

    return (
        <aside className="bg-white border-line flex flex-col justify-between border-t p-6 shadow-warm-lg lg:sticky lg:top-0 lg:h-dvh lg:min-h-[640px] lg:border-t-0 lg:border-l">
            <div>
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-brand-text text-xl font-extrabold tracking-tight">
                            Keranjang Pesanan
                        </h2>
                        <p className="text-brand-muted text-xs">
                            {table ? `Meja ${table.number}` : (store?.name ?? 'Menanti Pagi')}
                        </p>
                    </div>
                    <span className="bg-brand-mist text-brand-dark border-line shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold">
                        #{orderCode}
                    </span>
                </div>

                <ModeBar mode={cart.mode} onChange={changeMode} locked={locked} className="mb-6" />

                {cart.items.length === 0 ? (
                    <div className="py-10 text-center">
                        <span className="bg-brand-mist text-brand mx-auto mb-3 grid size-10 place-items-center rounded-xl">
                            <Coffee className="size-5" aria-hidden="true" />
                        </span>
                        <p className="text-brand-text text-[13.5px] font-bold">Belum ada pesanan</p>
                        <p className="text-brand-muted mx-auto mt-1 max-w-[220px] text-xs leading-relaxed">
                            Pilih kopi favoritmu, nanti ringkasannya muncul di sini.
                        </p>
                        <Link href="/#menu" className="mt-4 inline-block">
                            <span className="bg-brand hover:bg-brand-hover inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold text-white transition-colors">
                                Lihat menu
                            </span>
                        </Link>
                    </div>
                ) : (
                    <>
                        {cart.has_unavailable_items && (
                            <p className="border-danger/30 bg-danger-soft text-danger rounded-lg border px-3 py-2 text-xs font-medium">
                                Ada item yang tidak tersedia untuk mode ini.
                            </p>
                        )}

                        <ul className="max-h-[38vh] space-y-4 overflow-y-auto pr-1">
                            {cart.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="bg-canvas/60 border-line/50 rounded-xl border p-3"
                                >
                                    <div className="flex gap-3">
                                        <ProductThumb name={item.product_name} size={56} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-1">
                                                <p className="text-brand-text truncate text-xs font-bold">
                                                    {item.product_name}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={pending}
                                                    aria-label={`Hapus ${item.product_name}`}
                                                    className="text-brand-muted hover:text-danger shrink-0 transition-colors disabled:opacity-40"
                                                >
                                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                                </button>
                                            </div>
                                            <p className="text-brand-muted mb-2 text-[11px]">
                                                {[item.size_name, item.temperature_name]
                                                    .filter(Boolean)
                                                    .join(' · ') || 'Regular'}
                                                {item.addons.length > 0 &&
                                                    ` · ${formatAddons(item.addons)}`}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="tabular text-brand text-xs font-extrabold">
                                                    {formatRupiah(item.line_total)}
                                                </span>
                                                <div className="flex items-center rounded-md border border-line bg-white px-1 py-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, item.qty - 1)}
                                                        disabled={pending}
                                                        className="text-brand-muted hover:text-brand px-1.5 text-xs font-bold disabled:opacity-40"
                                                        aria-label={`Kurangi ${item.product_name}`}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="tabular text-brand-text px-1.5 text-xs font-bold">
                                                        {item.qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, item.qty + 1)}
                                                        disabled={pending}
                                                        className="text-brand-muted hover:text-brand px-1.5 text-xs font-bold disabled:opacity-40"
                                                        aria-label={`Tambah ${item.product_name}`}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <CartItemExtras item={item} />
                                </li>
                            ))}
                        </ul>

                        {cart.mode === 'delivery' && remainingForDelivery > 0 && (
                            <p className="border-warning/30 bg-warning-soft text-warning mt-4 rounded-lg border px-3 py-2 text-[11px] font-medium">
                                Tambah {formatRupiah(remainingForDelivery)} lagi untuk minimal belanja antar.
                            </p>
                        )}
                    </>
                )}
            </div>

            {cart.items.length > 0 && (
                <div className="border-line mt-4 border-t pt-5">
                    <div className="space-y-2 text-xs">
                        <div className="text-brand-muted flex justify-between font-medium">
                            <span>Jumlah Item ({itemCount} item)</span>
                            <span className="text-brand-text font-semibold">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </div>
                        <div className="border-line flex items-baseline justify-between border-t border-dashed pt-2">
                            <span className="text-brand-text text-sm font-bold">Total Bayar</span>
                            <span className="tabular text-brand text-xl font-extrabold">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </div>
                    </div>

                    <Link href="/checkout" className="mt-4 block">
                        <span className="bg-brand hover:bg-brand-hover flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-extrabold text-white shadow-warm-md transition-all active:scale-[0.98]">
                            Pesan Sekarang
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </span>
                    </Link>
                    <p className="text-brand-muted mt-2.5 text-center text-[10px]">
                        Pesanan diteruskan langsung ke Barista &amp; Dapur
                    </p>
                </div>
            )}
        </aside>
    );
}
