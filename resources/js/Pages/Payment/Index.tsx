import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    CreditCard,
    ReceiptText,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { PublicPageHeader } from '@/Components/layouts/PublicPageHeader';
import { Button } from '@/Components/ui/Button';
import { ProductThumb } from '@/Components/ui/ProductThumb';
import { useToast } from '@/Context/ToastContext';
import { retryPayment } from '@/lib/api/endpoints';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/datetime';
import { formatCountdown } from '@/lib/utils';
import { isAwaitingPayment, statusMeta, toneClasses } from '@/lib/order/status';
import { cn } from '@/lib/cn';
import type { PaymentInfo, PaymentPageProps } from '@/types';

export default function PaymentIndex({ order, server_time }: PaymentPageProps) {
    const toast = useToast();
    const [payment, setPayment] = useState<PaymentInfo | null>(order.payment);
    const [now, setNow] = useState(() => Date.now());
    const [retrying, setRetrying] = useState(false);

    const [serverOffset] = useState(() => new Date(server_time).getTime() - Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : null;
    const remaining = expiresAt === null ? null : Math.max(0, expiresAt - (now + serverOffset));
    const expired = isAwaitingPayment(order.status) && remaining !== null && remaining <= 0;
    const awaiting = isAwaitingPayment(order.status) && !expired;

    const meta = statusMeta(order.status);
    const redirectUrl = payment?.redirect_url ?? order.payment?.redirect_url ?? null;

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const next = await retryPayment(order.public_token);
            setPayment(next);

            if (next.redirect_url) {
                window.location.href = next.redirect_url;
                return;
            }

            toast.push('Transaksi dibuat, tetapi tautan pembayaran belum tersedia.', 'info');
        } catch (error) {
            toast.push(toApiError(error).message, 'error');
        } finally {
            setRetrying(false);
        }
    };

    return (
        <AppShell nav={false}>
            <PublicPageHeader
                title="Pembayaran"
                meta={`Langkah 2 dari 2 · #${order.order_number}`}
            />

            <div className="space-y-4 px-4 pb-10 md:px-6 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-6 lg:pb-16">
                <section className="rule pt-5 lg:col-span-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-ink-muted text-[13px] font-medium">
                                {awaiting ? 'Selesaikan dalam' : 'Status pesanan'}
                            </p>
                            {awaiting && remaining !== null ? (
                                <p className="font-display tabular text-ink mt-1 text-[46px] leading-none font-semibold">
                                    {formatCountdown(remaining)}
                                </p>
                            ) : (
                                <p className="font-display text-ink mt-1 text-[30px] leading-tight font-semibold">
                                    {expired ? 'Waktu habis' : meta.label}
                                </p>
                            )}
                            <p className="text-ink-muted mt-2 text-[12px]">
                                {awaiting
                                    ? 'Pesanan otomatis dibatalkan bila pembayaran lewat batas waktu.'
                                    : expired
                                      ? 'Buat pesanan baru untuk mencoba lagi.'
                                      : `Total ${formatRupiah(order.total)}`}
                            </p>
                        </div>

                        <span
                            className={cn(
                                'grid size-12 shrink-0 place-items-center rounded-full',
                                awaiting ? 'bg-brand-soft text-brand' : toneClasses[meta.tone],
                            )}
                        >
                            {awaiting ? (
                                <Clock3 className="size-5" />
                            ) : expired || order.status === 'EXPIRED' ? (
                                <XCircle className="size-5" />
                            ) : (
                                <CheckCircle2 className="size-5" />
                            )}
                        </span>
                    </div>

                    <div className="slip mt-4 flex flex-wrap items-end justify-between gap-3 px-4 py-3">
                        <div>
                            <p className="text-surface/60 text-[12px]">Total tagihan</p>
                            <p className="tabular text-surface text-xl font-bold">
                                {formatRupiah(order.total)}
                            </p>
                        </div>
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-[11px] font-bold',
                                toneClasses[meta.tone],
                            )}
                        >
                            {meta.label}
                        </span>
                    </div>
                </section>

                {awaiting && (
                    <section className="rule pt-5">
                        <div className="flex items-start gap-3">
                            <span className="bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-full">
                                <CreditCard className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-ink text-[13px] font-semibold">
                                    Metode pembayaran
                                </p>
                                <p className="text-ink-muted mt-0.5 text-[13px] leading-relaxed">
                                    QRIS, virtual account, dan e-wallet dipilih di halaman gateway
                                    yang aman.
                                </p>
                                {payment?.payment_method && (
                                    <p className="text-brand mt-1 text-[13px] font-semibold">
                                        {payment.payment_method}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            {redirectUrl ? (
                                <a href={redirectUrl} className="block">
                                    <Button size="lg" fullWidth>
                                        Lanjutkan pembayaran
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </a>
                            ) : (
                                <Button
                                    size="lg"
                                    fullWidth
                                    loading={retrying}
                                    onClick={handleRetry}
                                >
                                    Buat tautan pembayaran
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.reload({ only: ['order', 'server_time'] })
                                    }
                                >
                                    <RefreshCw className="size-4" />
                                    Cek status
                                </Button>
                                <Link href={`/pesanan/${order.public_token}`}>
                                    <Button variant="outline" fullWidth>
                                        Detail pesanan
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <p className="text-ink-muted mt-3 flex items-center justify-center gap-1.5 text-center text-[12px]">
                            <ShieldCheck className="size-3" />
                            Transaksi diproses oleh gateway pembayaran resmi.
                        </p>
                    </section>
                )}

                {!awaiting && (
                    <section className="rule pt-5">
                        {order.status === 'PENDING_PAYMENT' && expired ? (
                            <p className="text-ink-muted text-[13px] leading-relaxed">
                                Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru dari
                                menu.
                            </p>
                        ) : (
                            <p className="text-ink-muted flex items-start gap-2 text-[13px] leading-relaxed">
                                <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                                Pembayaran sudah diterima. Pesanan akan diproses oleh barista.
                            </p>
                        )}
                        <Link href={`/pesanan/${order.public_token}`} className="mt-3 block">
                            <Button variant="secondary" fullWidth>
                                Lihat status pesanan
                            </Button>
                        </Link>
                    </section>
                )}

                <section className="rule pt-5">
                    <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                        <ReceiptText className="text-brand size-4" />
                        Detail pesanan
                    </h2>

                    <ul className="mt-3 space-y-2.5">
                        {order.items.map((item, index) => (
                            <li
                                key={`${item.product_name}-${index}`}
                                className="flex items-center gap-3"
                            >
                                <ProductThumb name={item.product_name} size={44} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink truncate text-[13px] font-semibold">
                                        {item.product_name}
                                    </p>
                                    <p className="text-ink-muted text-[13px]">
                                        {[item.size_name, item.temperature_name]
                                            .filter(Boolean)
                                            .join(' · ') || 'Regular'}
                                        {' · '}
                                        {item.qty}x
                                    </p>
                                </div>
                                <span className="tabular text-ink text-[13px] font-semibold">
                                    {formatRupiah(item.line_total)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="border-line/70 mt-3 space-y-1.5 border-t pt-3 text-[13px]">
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Subtotal</span>
                            <span className="tabular text-ink">{formatRupiah(order.subtotal)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Biaya antar</span>
                                <span className="tabular text-ink">
                                    {formatRupiah(order.delivery_fee)}
                                </span>
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
                            <span className="text-ink font-semibold">Total</span>
                            <span className="tabular text-brand font-bold">
                                {formatRupiah(order.total)}
                            </span>
                        </div>
                    </div>

                    <p className="text-ink-muted mt-3 text-[11px]">
                        Dibuat {formatDateTime(order.created_at)}
                        {order.expires_at &&
                            awaiting &&
                            ` · kedaluwarsa ${formatDateTime(order.expires_at)}`}
                    </p>
                </section>
            </div>
        </AppShell>
    );
}
