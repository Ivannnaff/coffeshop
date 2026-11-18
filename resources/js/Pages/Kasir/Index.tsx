import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    ShoppingBag,
    Trash2,
    UtensilsCrossed,
} from 'lucide-react';
import { StaffLayout } from '@/Components/layouts/StaffLayout';
import { SearchField } from '@/Components/ui/SearchField';
import { CategoryTabs } from '@/Components/ui/CategoryTabs';
import { ProductCard } from '@/Components/ui/ProductCard';
import { ProductSheet } from '@/Components/menu/ProductSheet';
import { Button } from '@/Components/ui/Button';
import { QtyStepper } from '@/Components/ui/QtyStepper';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { EmptyState } from '@/Components/ui/EmptyState';
import { useToast } from '@/Context/ToastContext';
import { createCashierOrder } from '@/lib/kasir/api';
import { toApiError } from '@/lib/api/client';
import { defaultVariantIds, needsChoices, priceWithExtras } from '@/lib/menu/product';
import { formatRupiah } from '@/lib/format/currency';
import { cn } from '@/lib/cn';
import type { AddCartItemPayload, Product } from '@/types';
import type { KasirPageProps } from '@/types/kds';

interface KasirLine {
    key: string;
    productId: number;
    name: string;
    meta: string;
    variantIds: number[];
    addonIds: number[];
    unitPrice: number;
    qty: number;
    note: string | null;
}

export default function KasirIndex({ staff, categories, tables }: KasirPageProps) {
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        categories[0]?.id ?? null,
    );
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);

    const [lines, setLines] = useState<KasirLine[]>([]);
    const [mode, setMode] = useState<'takeaway' | 'dine_in'>('takeaway');
    const [tableId, setTableId] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [lastOrder, setLastOrder] = useState<{ number: string; total: number } | null>(null);

    const allProducts = useMemo(
        () => categories.flatMap((category) => category.products),
        [categories],
    );

    const currentCategory = categories.find((category) => category.id === selectedCategory);

    const visibleProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        const base = term === '' ? (currentCategory?.products ?? []) : allProducts;

        if (term === '') return base;

        return base.filter(
            (product) =>
                product.name.toLowerCase().includes(term) ||
                (product.description ?? '').toLowerCase().includes(term),
        );
    }, [allProducts, currentCategory, search]);

    const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);

    const handleAdd = async (payload: AddCartItemPayload) => {
        const product = allProducts.find((item) => item.id === payload.product_id);
        if (!product) return;

        const variantIds = [...(payload.variant_ids ?? [])].sort((a, b) => a - b);
        const addonIds = [...(payload.addon_ids ?? [])].sort((a, b) => a - b);
        const selectedVariants = product.variants.filter((variant) =>
            variantIds.includes(variant.id),
        );
        const addonNames = product.addon_groups
            .flatMap((group) => group.addons)
            .filter((addon) => addonIds.includes(addon.id))
            .map((addon) => addon.name);

        const meta = [...selectedVariants.map((variant) => variant.name), ...addonNames].join(' · ');
        const unitPrice = priceWithExtras(product, variantIds, addonIds);
        const trimmedNote = payload.note?.trim() || null;
        const key = [
            product.id,
            variantIds.join('.'),
            addonIds.join('.'),
            trimmedNote ?? '',
        ].join('|');

        setLines((current) => {
            const existing = current.find((line) => line.key === key);

            if (existing) {
                return current.map((line) =>
                    line.key === key
                        ? { ...line, qty: Math.min(99, line.qty + payload.qty) }
                        : line,
                );
            }

            return [
                ...current,
                {
                    key,
                    productId: product.id,
                    name: product.name,
                    meta,
                    variantIds,
                    addonIds,
                    unitPrice,
                    qty: payload.qty,
                    note: trimmedNote,
                },
            ];
        });
    };

    const handleQuickAdd = (product: Product) => {
        if (needsChoices(product)) {
            setActiveProduct(product);
            return;
        }

        void handleAdd({
            product_id: product.id,
            variant_ids: defaultVariantIds(product),
            addon_ids: [],
            qty: 1,
        });
    };

    const changeQty = (key: string, delta: number) => {
        setLines((current) =>
            current
                .map((line) =>
                    line.key === key ? { ...line, qty: Math.min(99, line.qty + delta) } : line,
                )
                .filter((line) => line.qty > 0),
        );
    };

    const submit = async () => {
        if (lines.length === 0) return;

        if (mode === 'dine_in' && tableId === null) {
            toast.push('Pilih meja untuk pesanan dine-in.', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const order = await createCashierOrder({
                mode,
                table_id: mode === 'dine_in' ? tableId : null,
                customer_name: customerName.trim() === '' ? null : customerName.trim(),
                pickup_note: note.trim() === '' ? null : note.trim(),
                items: lines.map((line) => ({
                    product_id: line.productId,
                    variant_ids: line.variantIds,
                    addon_ids: line.addonIds,
                    qty: line.qty,
                    note: line.note,
                })),
            });

            setLastOrder({ number: order.order_number, total: order.total });
            setLines([]);
            setCustomerName('');
            setNote('');
            toast.push(`Pesanan ${order.order_number} terkirim ke dapur`);
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StaffLayout staff={staff} context="Kasir" title="Kasir" subtitle="Pesanan langsung di kasir">
            <Head title="Kasir" />

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">
                                Kasir
                            </p>
                            <h1 className="mt-1 text-2xl font-bold text-ink md:text-[30px]">
                                Pilih menu
                            </h1>
                            <p className="mt-1 text-[12px] text-ink-muted">
                                Tambahkan item, lalu bayar tunai dan kirim ke dapur.
                            </p>
                        </div>
                        <div className="w-full sm:w-[280px]">
                            <SearchField
                                value={search}
                                onChange={setSearch}
                                placeholder="Cari menu..."
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <CategoryTabs
                            categories={categories}
                            selectedId={selectedCategory}
                            onSelect={(id) => {
                                setSelectedCategory(id);
                                setSearch('');
                            }}
                        />
                    </div>

                    {visibleProducts.length === 0 ? (
                        <EmptyState
                            className="mt-4 rounded-2xl bg-surface"
                            title="Menu tidak ditemukan"
                            description="Coba kata kunci atau kategori lain."
                        />
                    ) : (
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
                            {visibleProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onSelect={setActiveProduct}
                                    onQuickAdd={handleQuickAdd}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <aside id="current-order" className="mt-5 lg:mt-0 lg:sticky lg:top-24">
                    <section className="rounded-2xl border border-line/70 bg-surface p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-[15px] font-bold text-ink">Pesanan saat ini</h2>
                                <p className="text-[11px] text-ink-muted">
                                    {itemCount} item · {formatRupiah(total)}
                                </p>
                            </div>
                            {lines.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setLines([])}
                                    className="text-[11px] font-semibold text-ink-muted hover:text-danger"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>

                        {lastOrder && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-[11.5px] text-brand-hover">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        Pesanan {lastOrder.number} terkirim ke dapur.
                                    </p>
                                    <p className="mt-0.5 text-brand-hover/80">
                                        Total {formatRupiah(lastOrder.total)}.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-canvas p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('takeaway');
                                    setTableId(null);
                                }}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold transition-colors',
                                    mode === 'takeaway'
                                        ? 'bg-brand text-white'
                                        : 'text-ink-muted hover:text-ink',
                                )}
                            >
                                <ShoppingBag className="size-3.5" />
                                Takeaway
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('dine_in')}
                                className={cn(
                                    'flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold transition-colors',
                                    mode === 'dine_in'
                                        ? 'bg-brand text-white'
                                        : 'text-ink-muted hover:text-ink',
                                )}
                            >
                                <UtensilsCrossed className="size-3.5" />
                                Dine in
                            </button>
                        </div>

                        {mode === 'dine_in' && (
                            <select
                                value={tableId ?? ''}
                                onChange={(event) =>
                                    setTableId(event.target.value === '' ? null : Number(event.target.value))
                                }
                                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                            >
                                <option value="">Pilih meja</option>
                                {tables.map((table) => (
                                    <option key={table.id} value={table.id}>
                                        Meja {table.number}
                                    </option>
                                ))}
                            </select>
                        )}

                        <input
                            value={customerName}
                            onChange={(event) => setCustomerName(event.target.value)}
                            placeholder="Nama pelanggan (opsional)"
                            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                        />

                        {lines.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-line px-3 py-8 text-center">
                                <p className="text-[12px] font-semibold text-ink">Belum ada item</p>
                                <p className="mt-1 text-[11px] text-ink-muted">
                                    Ketuk menu di sebelah kiri untuk menambah pesanan.
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-3 space-y-2">
                                {lines.map((line) => (
                                    <li
                                        key={line.key}
                                        className="rounded-xl border border-line/70 p-2.5"
                                    >
                                        <div className="flex gap-2">
                                            <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-canvas-deep">
                                                <CoffeeArt seed={line.name} compact />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="truncate text-[12.5px] font-semibold text-ink">
                                                        {line.name}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setLines((current) =>
                                                                current.filter(
                                                                    (item) => item.key !== line.key,
                                                                ),
                                                            )
                                                        }
                                                        aria-label={`Hapus ${line.name}`}
                                                        className="grid size-6 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                </div>
                                                {line.meta && (
                                                    <p className="truncate text-[10.5px] text-ink-muted">
                                                        {line.meta}
                                                    </p>
                                                )}
                                                {line.note && (
                                                    <p className="mt-0.5 text-[10.5px] italic text-ink-muted">
                                                        “{line.note}”
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center justify-between">
                                                    <QtyStepper
                                                        size="sm"
                                                        value={line.qty}
                                                        onDecrease={() => changeQty(line.key, -1)}
                                                        onIncrease={() => changeQty(line.key, 1)}
                                                    />
                                                    <span className="text-[12.5px] font-bold tabular text-brand">
                                                        {formatRupiah(line.unitPrice * line.qty)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <input
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Catatan pesanan (opsional)"
                            className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                        />

                        <div className="mt-3 space-y-1 border-t border-line/70 pt-3 text-[12.5px]">
                            <div className="flex items-center justify-between">
                                <span className="text-ink-muted">Subtotal</span>
                                <span className="font-semibold tabular text-ink">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-ink">Total</span>
                                <span className="text-lg font-bold tabular text-brand">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            fullWidth
                            className="mt-3"
                            loading={submitting}
                            disabled={lines.length === 0 || (mode === 'dine_in' && tableId === null)}
                            onClick={submit}
                        >
                            <Banknote className="size-4" />
                            Bayar tunai &amp; kirim
                        </Button>
                        <p className="mt-2 text-center text-[10.5px] text-ink-muted">
                            Pembayaran tunai diterima di kasir. Pesanan langsung masuk ke KDS.
                        </p>
                    </section>
                </aside>
            </div>

            {lines.length > 0 && (
                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById('current-order')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="fixed inset-x-4 bottom-24 z-30 flex items-center justify-between rounded-xl bg-brand px-4 py-3 text-white shadow-lg lg:hidden"
                >
                    <span className="text-[12.5px] font-semibold">{itemCount} item</span>
                    <span className="text-[13px] font-bold tabular">{formatRupiah(total)}</span>
                </button>
            )}

            <ProductSheet
                key={activeProduct?.id ?? 'closed'}
                product={activeProduct}
                onClose={() => setActiveProduct(null)}
                onAdd={handleAdd}
            />
        </StaffLayout>
    );
}
