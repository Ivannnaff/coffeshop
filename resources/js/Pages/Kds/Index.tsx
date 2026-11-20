import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Loader2, RefreshCw, Wifi } from 'lucide-react';
import { StaffLayout } from '@/Components/layouts/StaffLayout';
import { OrderCard } from '@/Components/kds/OrderCard';
import { Button } from '@/Components/ui/Button';
import { Chip } from '@/Components/ui/Chip';
import { useToast } from '@/Context/ToastContext';
import { fetchKdsOrders, transitionOrder } from '@/lib/kds/api';
import { toApiError } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import type { KdsAction, KdsPageProps, StaffOrder } from '@/types/kds';
import type { OrderStatus } from '@/types';

const COLUMNS: { status: OrderStatus; label: string; hint: string }[] = [
    { status: 'PAID', label: 'Pesanan baru', hint: 'Sudah dibayar' },
    { status: 'PREPARING', label: 'Disiapkan', hint: 'Sedang dibuat' },
    { status: 'READY', label: 'Siap', hint: 'Tunggu diambil / diantar' },
    { status: 'OUT_FOR_DELIVERY', label: 'Diantar', hint: 'Dalam perjalanan' },
];

export default function KdsIndex({ staff }: KdsPageProps) {
    const toast = useToast();
    const [orders, setOrders] = useState<StaffOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [activeStatus, setActiveStatus] = useState<OrderStatus>('PAID');
    const [busyId, setBusyId] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const load = useCallback(async () => {
        try {
            const data = await fetchKdsOrders();
            setOrders(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (requestError) {
            setError(toApiError(requestError).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initial = window.setTimeout(() => {
            void load();
        }, 0);

        const poll = window.setInterval(() => {
            void load();
        }, 10000);

        return () => {
            window.clearTimeout(initial);
            window.clearInterval(poll);
        };
    }, [load]);

    useEffect(() => {
        const tick = window.setInterval(() => setNow(Date.now()), 30000);

        return () => window.clearInterval(tick);
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') void load();
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [load]);

    const counts = useMemo(() => {
        return COLUMNS.reduce<Record<string, number>>((accumulator, column) => {
            accumulator[column.status] = orders.filter(
                (order) => order.status === column.status,
            ).length;

            return accumulator;
        }, {});
    }, [orders]);

    const refresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleAction = async (order: StaffOrder, action: KdsAction) => {
        setBusyId(order.id);

        try {
            await transitionOrder(order.id, action, order.version);
            toast.push(`Status #${order.order_number} diperbarui`);
            await load();
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
            await load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <StaffLayout staff={staff}>
            <Head title="Kitchen Display" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-brand text-[10.5px] font-bold tracking-[0.18em] uppercase">
                        Kitchen Display
                    </p>
                    <h1 className="text-ink mt-1 text-2xl font-semibold md:text-[30px]">
                        Antrean pesanan
                    </h1>
                    <p className="text-ink-muted mt-1 text-[11.5px]">
                        {loading && orders.length === 0
                            ? 'Memuat antrean...'
                            : `${orders.length} pesanan aktif${
                                  lastUpdated
                                      ? ` · diperbarui ${lastUpdated.toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}`
                                      : ''
                              }`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="bg-brand-soft text-brand inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide uppercase">
                        <Wifi className="size-3" />
                        Auto 10s
                    </span>
                    <Button variant="outline" size="sm" loading={refreshing} onClick={refresh}>
                        <RefreshCw className="size-3.5" />
                        Muat ulang
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-danger-soft text-danger mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-[12px] font-medium">
                    {error}
                    <button
                        type="button"
                        onClick={refresh}
                        className="font-bold underline underline-offset-2"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            <div className="scrollbar-hide mt-4 flex gap-1.5 overflow-x-auto lg:hidden">
                {COLUMNS.map((column) => (
                    <Chip
                        key={column.status}
                        active={activeStatus === column.status}
                        onClick={() => setActiveStatus(column.status)}
                    >
                        {column.label}
                        <span className="tabular ml-1 rounded-full bg-black/10 px-1.5 text-[10px]">
                            {counts[column.status] ?? 0}
                        </span>
                    </Chip>
                ))}
            </div>

            {loading && orders.length === 0 ? (
                <div className="text-ink-muted flex items-center justify-center gap-2 py-20 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat pesanan...
                </div>
            ) : (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
                    {COLUMNS.map((column) => {
                        const list = orders.filter((order) => order.status === column.status);

                        return (
                            <section
                                key={column.status}
                                className={cn(
                                    'border-line/70 bg-canvas-deep/35 flex min-w-[290px] flex-col rounded-2xl border p-2.5 lg:min-w-0',
                                    activeStatus !== column.status && 'hidden lg:flex',
                                )}
                            >
                                <header className="flex items-start justify-between gap-2 px-1.5 py-1">
                                    <div>
                                        <h2 className="text-ink text-[13px] font-semibold">
                                            {column.label}
                                        </h2>
                                        <p className="text-ink-muted text-[10.5px]">
                                            {column.hint}
                                        </p>
                                    </div>
                                    <span className="bg-surface tabular text-ink grid min-w-7 place-items-center rounded-full px-2 py-0.5 text-[11px] font-bold">
                                        {list.length}
                                    </span>
                                </header>

                                <div className="mt-2 space-y-2.5">
                                    {list.length === 0 ? (
                                        <p className="border-line text-ink-muted rounded-xl border border-dashed px-3 py-8 text-center text-[11.5px]">
                                            Tidak ada pesanan
                                        </p>
                                    ) : (
                                        list.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                now={now}
                                                busy={busyId === order.id}
                                                onAction={(action) => handleAction(order, action)}
                                            />
                                        ))
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </StaffLayout>
    );
}
