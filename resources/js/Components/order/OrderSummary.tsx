import { Order } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format/currency';

export function OrderSummary({ order }: { order: Order }) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Rincian pesanan</h2>

            <ul className="flex flex-col gap-3">
                {order.items.map((item, index) => {
                    const variantText = [item.size_name, item.temperature_name].filter(Boolean).join(' • ');
                    const addonText = item.addons.map((addon) => addon.name).join(', ');

                    return (
                        <li key={`${item.product_name}-${index}`} className="flex justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-ink">
                                    {item.qty} x {item.product_name}
                                </p>
                                {variantText && <p className="text-[13px] text-ink-muted">{variantText}</p>}
                                {addonText && <p className="text-[13px] text-ink-muted">Add-on: {addonText}</p>}
                                {item.note && <p className="text-[13px] text-accent">Catatan: {item.note}</p>}
                            </div>
                            <p className="tabular shrink-0 text-sm font-medium text-ink">
                                {formatRupiah(item.line_total)}
                            </p>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-1 flex flex-col gap-2 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-ink-muted">Subtotal</span>
                    <span className="tabular text-ink">{formatRupiah(order.subtotal)}</span>
                </div>
                {order.mode === 'delivery' && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Ongkir</span>
                            <span className="tabular text-ink">{formatRupiah(order.delivery_fee)}</span>
                        </div>
                        {order.delivery_discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Potongan ongkir</span>
                                <span className="tabular text-success">
                                    -{formatRupiah(order.delivery_discount)}
                                </span>
                            </div>
                        )}
                    </>
                )}
                <div className="flex justify-between border-t border-line pt-2">
                    <span className="font-semibold text-ink">Total</span>
                    <span className="tabular font-semibold text-brand">{formatRupiah(order.total)}</span>
                </div>
            </div>
        </div>
    );
}
