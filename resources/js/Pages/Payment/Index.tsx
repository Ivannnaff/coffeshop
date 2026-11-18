import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
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
import { Button } from '@/Components/ui/Button';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
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
            <header className="flex items-center gap-3 px-4 pb-4 pt-5 md:px-6 lg:mx-auto lg:max-w-5xl lg:pb-6 lg:pt-8">
                <Link
                    href="/"
                    aria-label="Kembali ke menu"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink"
                >
                    <ArrowLeft className="size-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-ink">Pembayaran</h1>
                    <p className="text-[11.5px] text-ink-muted">
                        Langkah 2 dari 2 · #{order.order_number}
                    </p>
                </div>
            </header>

            <div className="space-y-4 px-4 pb-10 md:px-6 lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-6 lg:pb-16">
                <section
                    className={cn(
                        'overflow-hidden rounded-[24px] p-5 text-white lg:col-span-2 lg:p-6',
                        awaiting ? 'bg-brand' : 'bg-ink',
                    )}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                                {awaiting ? 'Selesaikan dalam' : 'Status pesanan'}
                            </p>
                            {awaiting && remaining !== null ? (
                                <p className="mt-1 font-display text-[46px] font-semibold leading-none tabular">
                                    {formatCountdown(remaining)}
                                </p>
                            ) : (
                                <p className="mt-1 font-display text-[30px] font-semibold leading-tight">
                                    {expired ? 'Waktu habis' : meta.label}
                                </p>
                            )}
                            <p className="mt-2 text-[12px] text-white/70">
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
                                awaiting ? 'bg-white/15' : 'bg-white/10',
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

                    <div className="mt-5 flex items-end justify-between border-t border-white/15 pt-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/50">Total tagihan</p>
                            <p className="text-xl font-bold tabular">{formatRupiah(order.total)}</p>
                        </div>
                        <span className={cn('rounded-full px-3 py-1 text-[11px] font-bold', toneClasses[meta.tone])}>
                            {meta.label}
                        </span>
                    </div>
                </section>

                {awaiting && (
                    <section className="rounded-2xl border border-line/60 bg-surface p-4">
                        <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                                <CreditCard className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-ink">Metode pembayaran</p>
                                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                                    QRIS, virtual account, dan e-wallet dipilih di halaman gateway yang aman.
                                </p>
                                {payment?.payment_method && (
                                    <p className="mt-1 text-[11.5px] font-semibold text-brand">
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
                                <Button size="lg" fullWidth loading={retrying} onClick={handleRetry}>
                                    Buat tautan pembayaran
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.reload({ only: ['order', 'server_time'] })}
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

                        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10.5px] text-ink-muted">
                            <ShieldCheck className="size-3" />
                            Transaksi diproses oleh gateway pembayaran resmi.
                        </p>
                    </section>
                )}

                {!awaiting && (
                    <section className="rounded-2xl border border-line/60 bg-surface p-4">
                        {order.status === 'PENDING_PAYMENT' && expired ? (
                            <p className="text-[13px] leading-relaxed text-ink-muted">
                                Batas waktu pembayaran sudah lewat. Silakan buat pesanan baru dari menu.
                            </p>
                        ) : (
                            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
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

                <section className="rounded-2xl border border-line/60 bg-surface p-4">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                        <ReceiptText className="size-4 text-brand" />
                        Detail pesanan
                    </h2>

                    <ul className="mt-3 space-y-2.5">
                        {order.items.map((item, index) => (
                            <li key={`${item.product_name}-${index}`} className="flex items-center gap-3">
                                <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-canvas-deep">
                                    <CoffeeArt seed={item.product_name} compact />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-ink">
                                        {item.product_name}
                                    </p>
                                    <p className="text-[11.5px] text-ink-muted">
                                        {[item.size_name, item.temperature_name].filter(Boolean).join(' · ') ||
                                            'Regular'}
                                        {' · '}
                                        {item.qty}x
                                    </p>
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
                            <span className="font-bold tabular text-brand">{formatRupiah(order.total)}</span>
                        </div>
                    </div>

                    <p className="mt-3 text-[11px] text-ink-muted">
                        Dibuat {formatDateTime(order.created_at)}
                        {order.expires_at && awaiting && ` · kedaluwarsa ${formatDateTime(order.expires_at)}`}
                    </p>
                </section>
            </div>
        </AppShell>
    );
}
