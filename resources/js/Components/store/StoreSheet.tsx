import { Clock, MapPin, Truck, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { Sheet } from '@/Components/ui/Sheet';
import { formatHours } from '@/lib/format/datetime';

interface StoreSheetProps {
    open: boolean;
    onClose: () => void;
}

export function StoreSheet({ open, onClose }: StoreSheetProps) {
    const store = useStore();

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Tentang toko"
            subtitle={store?.name ?? 'Menanti'}
        >
            {store ? (
                <div className="space-y-5 pb-2">
                    <div>
                        <div className="flex items-start gap-3">
                            <span className="border-line text-brand grid size-10 shrink-0 place-items-center rounded-full border">
                                <MapPin className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="font-display text-ink text-[16px]">{store.name}</p>
                                <p className="text-ink-muted mt-0.5 text-[13px] leading-relaxed">
                                    {store.address ?? 'Alamat toko belum diatur'}
                                </p>
                            </div>
                        </div>

                        {store.address && store.latitude && store.longitude && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="border-line text-brand hover:bg-brand-mist mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-[8px] border px-3 text-xs font-semibold transition-colors"
                            >
                                Buka di Google Maps
                                <ExternalLink className="size-3.5" aria-hidden="true" />
                            </a>
                        )}
                    </div>

                    <div className="border-line border-t border-dashed">
                        <InfoRow
                            icon={<Clock className="size-4" />}
                            label="Jam buka"
                            value={
                                formatHours(store.opening_time, store.closing_time) ||
                                'Belum diatur'
                            }
                        />
                        <InfoRow
                            icon={<Truck className="size-4" />}
                            label="Minimal belanja antar"
                            value={
                                store.delivery_min_item_price
                                    ? `Rp${new Intl.NumberFormat('id-ID').format(store.delivery_min_item_price)}`
                                    : 'Sesuai zona'
                            }
                        />
                        <InfoRow
                            icon={
                                store.is_accepting_orders ? (
                                    <CheckCircle2 className="size-4" />
                                ) : (
                                    <AlertCircle className="size-4" />
                                )
                            }
                            label="Status"
                            value={store.is_accepting_orders ? 'Menerima pesanan' : 'Sedang tutup'}
                            tone={store.is_accepting_orders ? 'success' : 'danger'}
                        />
                    </div>

                    <p className="text-ink-muted px-1 text-center text-xs">
                        Pesanan dibuat langsung ke dapur setelah pembayaran diterima.
                    </p>
                </div>
            ) : (
                <p className="text-ink-muted py-10 text-center text-sm">
                    Informasi toko belum tersedia.
                </p>
            )}
        </Sheet>
    );
}

function InfoRow({
    icon,
    label,
    value,
    tone = 'default',
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'danger';
}) {
    return (
        <div className="border-line flex items-center justify-between gap-3 border-b border-dashed py-3">
            <span className="text-ink-muted flex items-center gap-2 text-[13px]">
                <span className="text-ink-muted" aria-hidden="true">
                    {icon}
                </span>
                {label}
            </span>
            <span
                className={
                    tone === 'success'
                        ? 'text-success text-[13px] font-semibold'
                        : tone === 'danger'
                          ? 'text-danger text-[13px] font-semibold'
                          : 'text-ink text-[13px] font-semibold'
                }
            >
                {value}
            </span>
        </div>
    );
}
