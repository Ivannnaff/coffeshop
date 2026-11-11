import { CheckoutPreview, OrderMode } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format/currency';

interface CheckoutSummaryProps {
    mode: OrderMode;
    subtotal: number;
    minItemPrice: number;
    preview: CheckoutPreview | null;
    loading: boolean;
    error: string | null;
}

export function CheckoutSummary({
    mode,
    subtotal,
    minItemPrice,
    preview,
    loading,
    error,
}: CheckoutSummaryProps) {
    const isDelivery = mode === 'delivery';
    const total = isDelivery ? preview?.total ?? null : subtotal;

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Ringkasan</h2>

            <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="tabular font-medium text-ink">{formatRupiah(subtotal)}</span>
            </div>

            {isDelivery && (
                <>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-muted">Ongkir</span>
                        <span className="tabular font-medium text-ink">
                            {preview ? formatRupiah(preview.delivery_fee) : '-'}
                        </span>
                    </div>
                    {preview && preview.delivery_discount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-ink-muted">Potongan ongkir</span>
                            <span className="tabular font-medium text-success">
                                -{formatRupiah(preview.delivery_discount)}
                            </span>
                        </div>
                    )}
                </>
            )}

            <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
                <span className="font-semibold text-ink">Total</span>
                <span className="tabular text-lg font-semibold text-brand">
                    {total === null ? '-' : formatRupiah(total)}
                </span>
            </div>

            {isDelivery && (
                <p className="text-[13px] text-ink-muted">
                    Item di bawah {formatRupiah(minItemPrice)} per porsi tidak dihitung untuk potongan ongkir.
                </p>
            )}

            {loading && <p className="text-[13px] text-ink-muted">Menghitung ongkir...</p>}
            {error && <p className="text-[13px] text-danger">{error}</p>}
            {preview?.zone_name && (
                <p className="text-[13px] text-ink-muted">
                    Zona {preview.zone_name}
                    {preview.distance_km !== null ? `, ${preview.distance_km.toFixed(1)} km` : ''}
                </p>
            )}
        </div>
    );
}
