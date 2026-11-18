import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock3,
    MapPin,
    ReceiptText,
    RefreshCw,
    RotateCcw,
    ShoppingBag,
    StickyNote,
    Truck,
    UtensilsCrossed,
    Wallet,
} from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { Button } from '@/Components/ui/Button';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { StatusTimeline } from '@/Components/order/StatusTimeline';
import { useCart } from '@/Context/CartContext';
import { useToast } from '@/Context/ToastContext';
import { reorder } from '@/lib/api/endpoints';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/datetime';
import { isAwaitingPayment, isClosed, statusMeta, toneClasses } from '@/lib/order/status';
import { cn } from '@/lib/cn';
import { formatAddons } from '@/lib/utils';
import type { OrderPageProps, OrderMode } from '@/types';

const MODE_META: Record<OrderMode, { label: string; icon: typeof ShoppingBag }> = {
    dine_in: { label: 'Makan di tempat', icon: UtensilsCrossed },
    takeaway: { label: 'Bawa pulang', icon: ShoppingBag },
    delivery: { label: 'Diantar', icon: Truck },
};

export default function OrderIndex({ order }: OrderPageProps) {
    const toast = useToast();
    const { syncCart } = useCart();
    const [reordering, setReordering] = useState(false);

    const meta = statusMeta(order.status);
    const ModeIcon = MODE_META[order.mode].icon;
    const awaiting = isAwaitingPayment(order.status);
    const canReorder = !awaiting;

    const handleReorder = async () => {
        setReordering(true);
        try {
            const result = await reorder(order.public_token);
            syncCart(result.cart);

            if (result.skipped.length > 0) {
                toast.push(
                    `${result.skipped.length} item tidak tersedia dan dilewati.`,
                    'info',
                );
            } else {
                toast.push('Pesanan ditambahkan ke keranjang');
            }

            router.visit('/');
        } catch (error) {
            toast.push(toApiError(error).message, 'error');
        } finally {
            setReordering(false);
        }
    };

    const closedWithPayment = isClosed(order.status) || order.status === 'PAID';

    useEffect(() => {
        if (isClosed(order.status)) return;

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['order'] });
            }
        }, 12000);

        return () => window.clearInterval(timer);
    }, [order.status]);

    return (
        <AppShell nav={false}>
            <header className="flex items-center gap-3 px-4 pb-4 pt-5 md:px-6 lg:mx-auto lg:max-w-5xl lg:pb-6 lg:pt-8">
                <Link
                    href="/"
                    aria-label="Kembali ke menu"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink"
                >
                    <ArrowLeft className="size-5" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-ink">Pesanan</h1>
                    <p className="truncate text-[11.5px] text-ink-muted">#{order.order_number}</p>
                </div>
                <button
                    type="button"
                    onClick={() => router.reload()}
                    aria-label="Muat ulang status"
                    className="ml-auto grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-muted"
                >
                    <RefreshCw className="size-4" />
                </button>
            </header>

            <div className="space-y-4 px-4 pb-10 md:px-6 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-6 lg:pb-16">
                <section className="rounded-[26px] border border-line/60 bg-surface p-4 lg:col-span-2 lg:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide',
                                    toneClasses[meta.tone],
                                )}
                            >
                                {meta.label}
                            </span>
                            <h2 className="mt-2 text-[22px] font-semibold leading-tight text-ink">
                                {awaiting
                                    ? 'Menunggu pembayaran'
                                    : order.status === 'PAID'
                                      ? 'Pembayaran diterima'
                                      : order.status === 'PREPARING'
                                        ? 'Barista sedang menyeduh'
                                        : order.status === 'READY'
                                          ? 'Pesanan siap'
                                          : order.status === 'OUT_FOR_DELIVERY'
                                            ? 'Pesanan dalam perjalanan'
                                            : order.status === 'COMPLETED'
                                              ? 'Terima kasih!'
                                              : order.status === 'EXPIRED'
                                                ? 'Pesanan kedaluwarsa'
                                                : 'Pesanan dibatalkan'}
                            </h2>
                            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                                {awaiting
                                    ? 'Selesaikan pembayaran agar pesanan masuk ke dapur.'
                                    : isClosed(order.status)
                                      ? order.completed_at
                                          ? `Selesai ${formatDateTime(order.completed_at)}`
                                          : 'Pesanan ini sudah ditutup.'
                                      : 'Kami akan memperbarui status secara berkala.'}
                            </p>
                            {!isClosed(order.status) && (
                                <p className="mt-1 text-[10.5px] text-ink-muted/80">
                                    Diperbarui otomatis setiap 12 detik.
                                </p>
                            )}
                        </div>
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                            {awaiting ? <Wallet className="size-5" /> : <ReceiptText className="size-5" />}
                        </div>
                    </div>

                    {!isClosed(order.status) && (
                        <div className="mt-5">
                            <StatusTimeline status={order.status} mode={order.mode} />
                        </div>
                    )}

                    {awaiting && (
                        <div className="mt-4 space-y-2 border-t border-line/70 pt-4">
                            {order.expires_at && (
                                <p className="flex items-center gap-1.5 text-[11.5px] text-warning">
                                    <Clock3 className="size-3.5" />
                                    Bayar sebelum {formatDateTime(order.expires_at)}
                                </p>
                            )}
                            <Link href={`/pembayaran/${order.public_token}`}>
                                <Button fullWidth size="lg">
                                    <Wallet className="size-4" />
                                    Lanjutkan pembayaran
                                </Button>
                            </Link>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-line/60 bg-surface p-4">
                    <h2 className="text-[15px] font-semibold text-ink">Informasi pesanan</h2>

                    <dl className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex items-center justify-between gap-3">
                            <dt className="flex items-center gap-2 text-ink-muted">
                                <ModeIcon className="size-4" />
                                Mode
                            </dt>
                            <dd className="font-medium text-ink">{MODE_META[order.mode].label}</dd>
                        </div>

                        {order.table_number && (
                            <div className="flex items-center justify-between gap-3">
                                <dt className="flex items-center gap-2 text-ink-muted">
                                    <UtensilsCrossed className="size-4" />
                                    Meja
                                </dt>
                                <dd className="font-medium text-ink">{order.table_number}</dd>
                            </div>
                        )}

                        {order.mode === 'delivery' && (
                            <div className="flex items-start justify-between gap-3">
                                <dt className="flex items-center gap-2 text-ink-muted">
                                    <Truck className="size-4" />
                                    Pengiriman
                                </dt>
                                <dd className="text-right font-medium text-ink">
                                    {order.delivery_zone_name ?? 'Zona pengiriman'}
                                    <span className="block text-[11.5px] font-normal text-ink-muted">
                                        {order.delivery_address ?? 'Alamat terdaftar'}
                                    </span>
                                </dd>
                            </div>
                        )}

                        {order.mode === 'takeaway' && (
                            <div className="flex items-start justify-between gap-3">
                                <dt className="flex items-center gap-2 text-ink-muted">
                                    <MapPin className="size-4" />
                                    Pengambilan
                                </dt>
                                <dd className="text-right font-medium text-ink">Di kasir toko</dd>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <dt className="flex items-center gap-2 text-ink-muted">
                                <Clock3 className="size-4" />
                                Dibuat
                            </dt>
                            <dd className="font-medium text-ink">{formatDateTime(order.created_at)}</dd>
                        </div>

                        {order.pickup_note && (
                            <div className="flex items-start justify-between gap-3">
                                <dt className="flex items-center gap-2 text-ink-muted">
                                    <StickyNote className="size-4" />
                                    Catatan
                                </dt>
                                <dd className="max-w-[60%] text-right text-ink">{order.pickup_note}</dd>
                            </div>
                        )}
                    </dl>
                </section>

                <section className="rounded-2xl border border-line/60 bg-surface p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-ink">Item pesanan</h2>
                        <span className="text-[11.5px] text-ink-muted">
                            {order.items.reduce((sum, item) => sum + item.qty, 0)} item
                        </span>
                    </div>

                    <ul className="mt-3 space-y-2.5">
                        {order.items.map((item, index) => (
                            <li key={`${item.product_name}-${index}`} className="flex items-center gap-3">
                                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-canvas-deep">
                                    <CoffeeArt seed={item.product_name} compact />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-ink">
                                        {item.product_name}
                                    </p>
                                    <p className="text-[11.5px] text-ink-muted">
                                        {[item.size_name, item.temperature_name].filter(Boolean).join(' · ') ||
                                            'Regular'}
                                        {item.addons.length > 0 &&
                                            ` · ${formatAddons(item.addons)}`}
                                        {' · '}
                                        {item.qty}x
                                    </p>
                                    {item.note && (
                                        <p className="truncate text-[11px] italic text-ink-muted">
                                            “{item.note}”
                                        </p>
                                    )}
                                </div>
                                <span className="text-[13px] font-semibold tabular text-ink">
                                    {formatRupiah(item.line_total)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3 text-[13px]">
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Subtotal</span>
                            <span className="tabular text-ink">{formatRupiah(order.subtotal)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Biaya antar</span>
                                <span className="tabular text-ink">{formatRupiah(order.delivery_fee)}</span>
                            </div>
                        )}
                        {order.delivery_discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Diskon antar</span>
                                <span className="tabular text-success">
                                    -{formatRupiah(order.delivery_discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-1">
                            <span className="font-semibold text-ink">Total</span>
                            <span className="text-lg font-bold tabular text-brand">
                                {formatRupiah(order.total)}
                            </span>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-2 lg:col-span-2 lg:flex-row lg:justify-end">
                    {canReorder && (
                        <Button
                            size="lg"
                            variant={closedWithPayment ? 'primary' : 'secondary'}
                            loading={reordering}
                            onClick={handleReorder}
                            className="lg:w-auto"
                        >
                            <RotateCcw className="size-4" />
                            Pesan lagi
                        </Button>
                    )}
                    <Link href="/">
                        <Button variant="outline" size="lg" fullWidth>
                            Kembali ke menu
                        </Button>
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
