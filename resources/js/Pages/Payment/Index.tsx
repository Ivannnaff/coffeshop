import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PublicLayout } from '@/Layouts/PublicLayout';
import { Order } from '@/lib/api/types';
import { useCountdown } from '@/hooks/useCountdown';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors/messages';
import { formatRupiah } from '@/lib/format/currency';
import { safeRedirectUrl } from '@/lib/security/redirect';
import { Button } from '@/Components/ui/Button';
import { Countdown } from '@/Components/ui/Countdown';

interface PaymentProps {
    order: Order;
    server_time: string;
}

const paidStatuses = ['PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED'];

export default function PaymentIndex({ order: initialOrder, server_time }: PaymentProps) {
    const { order } = useOrderStatus(initialOrder);
    const { formatted, isExpired, isWarning } = useCountdown(order.expires_at, server_time);
    const [payment, setPayment] = useState(order.payment);
    const [retrying, setRetrying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPaid = paidStatuses.includes(order.status);
    const isCancelled = order.status === 'EXPIRED' || isExpired;
    const redirectUrl = safeRedirectUrl(payment?.redirect_url ?? null);

    const handleRetry = async () => {
        setRetrying(true);
        setError(null);
        try {
            const next = await api.retryPayment(order.public_token);
            setPayment(next);
        } catch (caught) {
            setError(
                caught instanceof ApiError
                    ? getErrorMessage(caught.code)
                    : 'Pembayaran gagal dibuat. Coba lagi.',
            );
        } finally {
            setRetrying(false);
        }
    };

    return (
        <PublicLayout>
            <Head title="Pembayaran" />
            <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-8">
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                    <p className="text-[13px] text-ink-muted">Nomor pesanan</p>
                    <p className="tabular font-semibold text-ink">{order.order_number}</p>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-ink-muted">Total pembayaran</span>
                        <span className="tabular text-xl font-semibold text-brand">
                            {formatRupiah(order.total)}
                        </span>
                    </div>

                    <div className="mt-6 border-t border-line pt-5">
                        <Countdown formatted={formatted} isWarning={isWarning} isExpired={isExpired} />
                    </div>
                </div>

                {isPaid ? (
                    <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
                        <p className="font-semibold text-success">Pembayaran diterima.</p>
                        <p className="mt-1 text-sm text-ink-muted">
                            Pesanan Anda sedang diproses. Lihat status pesanan untuk pembaruan.
                        </p>
                        <Link
                            href={`/pesanan/${order.public_token}`}
                            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                        >
                            Lihat status pesanan
                        </Link>
                    </div>
                ) : isCancelled ? (
                    <div className="rounded-2xl border border-line bg-surface p-5">
                        <p className="font-semibold text-ink">Waktu pembayaran habis.</p>
                        <p className="mt-1 text-sm text-ink-muted">
                            Pesanan ini dibatalkan otomatis. Silakan buat pesanan baru.
                        </p>
                        <Link
                            href="/"
                            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                        >
                            Kembali ke menu
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {redirectUrl ? (
                            <a
                                href={redirectUrl}
                                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                            >
                                Lanjut ke pembayaran
                            </a>
                        ) : (
                            <Button type="button" loading={retrying} onClick={handleRetry} className="w-full">
                                Coba bayar lagi
                            </Button>
                        )}
                        <p className="text-center text-[13px] text-ink-muted">
                            Setelah membayar, halaman status akan diperbarui otomatis.
                        </p>
                        {error && <p className="text-center text-[13px] text-danger">{error}</p>}
                    </div>
                )}

                {!isPaid && !isCancelled && (
                    <Link
                        href={`/pesanan/${order.public_token}`}
                        className="text-center text-sm font-medium text-brand hover:underline"
                    >
                        Lihat status pesanan
                    </Link>
                )}
            </div>
        </PublicLayout>
    );
}
