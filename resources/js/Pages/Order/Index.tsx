import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PublicLayout } from '@/Layouts/PublicLayout';
import { Order } from '@/lib/api/types';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors/messages';
import { formatRupiah } from '@/lib/format/currency';
import { OrderProgress } from '@/Components/order/OrderProgress';
import { OrderSummary } from '@/Components/order/OrderSummary';
import { Button } from '@/Components/ui/Button';

interface OrderProps {
    order: Order;
}

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Menunggu pembayaran',
    PAID: 'Dibayar',
    PREPARING: 'Sedang dibuat',
    READY: 'Siap diambil',
    OUT_FOR_DELIVERY: 'Sedang diantar',
    COMPLETED: 'Selesai',
    EXPIRED: 'Dibatalkan',
};

const modeLabels: Record<string, string> = {
    dine_in: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
};

export default function OrderIndex({ order: initialOrder }: OrderProps) {
    const { order, isOffline } = useOrderStatus(initialOrder);
    const [reordering, setReordering] = useState(false);
    const [skipped, setSkipped] = useState<string[] | null>(null);
    const [reorderError, setReorderError] = useState<string | null>(null);

    const handleReorder = async () => {
        setReordering(true);
        setReorderError(null);
        setSkipped(null);

        try {
            const result = await api.reorder(order.public_token);
            if (result.skipped_items.length > 0) {
                setSkipped(result.skipped_items);
            } else {
                router.visit('/keranjang');
            }
        } catch (caught) {
            setReorderError(
                caught instanceof ApiError
                    ? getErrorMessage(caught.code)
                    : 'Gagal menyalin pesanan. Coba lagi.',
            );
        } finally {
            setReordering(false);
        }
    };

    return (
        <PublicLayout>
            <Head title="Status Pesanan" />
            <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                    <p className="text-[13px] text-ink-muted">Nomor pesanan</p>
                    <p className="tabular text-lg font-semibold text-ink">{order.order_number}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                        <span>{modeLabels[order.mode] ?? order.mode}</span>
                        {order.table_number && <span>Meja {order.table_number}</span>}
                        <span className="tabular font-semibold text-brand">{formatRupiah(order.total)}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-ink-muted">Status:</span>
                        <span className="text-sm font-semibold text-ink">
                            {statusLabels[order.status] ?? order.status}
                        </span>
                    </div>

                    {order.mode === 'delivery' && order.delivery_address && (
                        <p className="mt-2 text-[13px] text-ink-muted">{order.delivery_address}</p>
                    )}

                    {isOffline && (
                        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] text-warning">
                            Pembaruan otomatis tidak aktif. Halaman akan mencoba memperbarui setiap 10 detik.
                        </p>
                    )}
                </div>

                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                    <h2 className="mb-4 font-display text-lg font-semibold text-ink">Progres pesanan</h2>
                    <OrderProgress status={order.status} mode={order.mode} />
                </div>

                <OrderSummary order={order} />

                {order.status === 'PENDING_PAYMENT' && (
                    <Link
                        href={`/pembayaran/${order.public_token}`}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                    >
                        Lanjutkan pembayaran
                    </Link>
                )}

                {skipped && skipped.length > 0 && (
                    <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
                        <p className="font-semibold text-ink">Sebagian item tidak tersedia</p>
                        <ul className="mt-2 list-inside list-disc text-sm text-ink-muted">
                            {skipped.map((name) => (
                                <li key={name}>{name}</li>
                            ))}
                        </ul>
                        <p className="mt-2 text-sm text-ink-muted">
                            Item lain sudah disalin ke keranjang.
                        </p>
                        <Link
                            href="/keranjang"
                            className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                        >
                            Lihat keranjang
                        </Link>
                    </div>
                )}

                {reorderError && <p className="text-[13px] text-danger">{reorderError}</p>}

                <Button type="button" variant="secondary" loading={reordering} onClick={handleReorder} className="w-full">
                    Pesan lagi
                </Button>
            </div>
        </PublicLayout>
    );
}
