import { useCallback, useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Coffee,
    Loader2,
    QrCode,
    ReceiptText,
    Store,
    TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { getReportSummary } from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import type { AdminPageProps, ReportSummary } from '@/types/admin';

function isoDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

export default function AdminDashboard({ staff }: AdminPageProps) {
    const [from, setFrom] = useState(() => {
        const today = new Date();

        return isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
    });
    const [to, setTo] = useState(() => isoDate(new Date()));
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await getReportSummary({ from, to });
            setSummary(data);
            setError(null);
        } catch (requestError) {
            setError(toApiError(requestError).message);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [load]);

    const orderCount = summary?.total_orders ?? 0;
    const revenue = summary?.total_revenue ?? 0;
    const topMax = Math.max(1, ...(summary?.top_products.map((product) => product.qty) ?? [1]));

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Ringkasan" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">Admin</p>
                    <h1 className="mt-1 text-2xl font-semibold text-ink md:text-[30px]">Ringkasan toko</h1>
                    <p className="mt-1 text-[12px] text-ink-muted">
                        Penjualan dari pesanan yang sudah dibayar.
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <label className="block">
                        <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                            Dari
                        </span>
                        <input
                            type="date"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                            className="rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                            Sampai
                        </span>
                        <input
                            type="date"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                            className="rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                        />
                    </label>
                </div>
            </div>

            {error && (
                <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12px] font-medium text-danger">
                    {error}
                </p>
            )}

            {loading && !summary ? (
                <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-muted">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat ringkasan...
                </div>
            ) : (
                <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Pendapatan"
                            value={formatRupiah(revenue)}
                            hint={`${from} — ${to}`}
                            icon={<TrendingUp className="size-4" />}
                            emphasis
                        />
                        <StatCard
                            label="Pesanan dibayar"
                            value={`${orderCount}`}
                            hint="Status dihitung sebagai penjualan"
                            icon={<ReceiptText className="size-4" />}
                        />
                        <StatCard
                            label="Item terjual"
                            value={`${summary?.total_items_sold ?? 0}`}
                            hint="Total qty seluruh item"
                            icon={<Coffee className="size-4" />}
                        />
                        <StatCard
                            label="Rata-rata / pesanan"
                            value={formatRupiah(orderCount > 0 ? Math.round(revenue / orderCount) : 0)}
                            hint="Pendapatan ÷ pesanan"
                            icon={<ArrowUpRight className="size-4" />}
                        />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[15px] font-semibold text-ink">Produk terlaris</h2>
                                <span className="text-[11px] text-ink-muted">5 teratas</span>
                            </div>

                            {summary && summary.top_products.length > 0 ? (
                                <ul className="mt-3 space-y-3">
                                    {summary.top_products.map((product) => (
                                        <li key={product.name}>
                                            <div className="flex items-center justify-between gap-3 text-[12.5px]">
                                                <span className="truncate font-medium text-ink">{product.name}</span>
                                                <span className="shrink-0 font-bold tabular text-brand">
                                                    {product.qty} pcs
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                                                <div
                                                    className="h-full rounded-full bg-brand"
                                                    style={{
                                                        width: `${Math.max(
                                                            6,
                                                            (product.qty / topMax) * 100,
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 rounded-xl border border-dashed border-line px-3 py-8 text-center text-[12px] text-ink-muted">
                                    Belum ada penjualan pada periode ini.
                                </p>
                            )}
                        </section>

                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <h2 className="text-[15px] font-semibold text-ink">Akses cepat</h2>
                            <div className="mt-3 grid gap-2">
                                <QuickLink href="/admin/produk" icon={<Coffee className="size-4" />} title="Kelola produk" subtitle="Harga, varian, add-on" />
                                <QuickLink href="/admin/meja" icon={<QrCode className="size-4" />} title="Meja & QR" subtitle="Token meja untuk dine-in" />
                                <QuickLink href="/admin/toko" icon={<Store className="size-4" />} title="Pengaturan toko" subtitle="Jam buka, ongkir, pembayaran" />
                            </div>
                        </section>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

function StatCard({
    label,
    value,
    hint,
    icon,
    emphasis,
}: {
    label: string;
    value: string;
    hint: string;
    icon: React.ReactNode;
    emphasis?: boolean;
}) {
    return (
        <div
            className={
                emphasis
                    ? 'rounded-2xl bg-brand p-4 text-white shadow-[0_18px_32px_-22px_rgba(22,163,74,1)]'
                    : 'rounded-2xl border border-line/70 bg-surface p-4'
            }
        >
            <div className="flex items-center justify-between">
                <span
                    className={
                        emphasis
                            ? 'text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/75'
                            : 'text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted'
                    }
                >
                    {label}
                </span>
                <span
                    className={
                        emphasis
                            ? 'grid size-8 place-items-center rounded-full bg-white/15 text-white'
                            : 'grid size-8 place-items-center rounded-full bg-brand-soft text-brand'
                    }
                >
                    {icon}
                </span>
            </div>
            <p
                className={
                    emphasis
                        ? 'mt-3 text-[26px] font-bold tabular leading-none'
                        : 'mt-3 text-[24px] font-bold tabular leading-none text-ink'
                }
            >
                {value}
            </p>
            <p
                className={
                    emphasis
                        ? 'mt-1.5 text-[10.5px] text-white/75'
                        : 'mt-1.5 text-[10.5px] text-ink-muted'
                }
            >
                {hint}
            </p>
        </div>
    );
}

function QuickLink({
    href,
    icon,
    title,
    subtitle,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-xl border border-line/70 px-3 py-2.5 transition-colors hover:border-brand/30 hover:bg-brand-mist"
        >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold text-ink">{title}</span>
                <span className="block truncate text-[10.5px] text-ink-muted">{subtitle}</span>
            </span>
            <ArrowUpRight className="size-3.5 text-ink-muted" />
        </Link>
    );
}
