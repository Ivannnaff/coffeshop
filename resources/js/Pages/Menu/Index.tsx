import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Check, ChevronDown, Coffee, MapPin, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { CartPanel } from '@/Components/cart/CartPanel';
import { SearchField } from '@/Components/ui/SearchField';
import { ProductCard } from '@/Components/ui/ProductCard';
import { EmptyState } from '@/Components/ui/EmptyState';
import { StoreSheet } from '@/Components/store/StoreSheet';
import { ProductSheet } from '@/Components/menu/ProductSheet';
import { SearchOverlay } from '@/Components/menu/SearchOverlay';
import { useCart } from '@/Context/CartContext';
import { formatRupiah } from '@/lib/format/currency';
import { defaultVariantIds, requiredAddonGroups } from '@/lib/menu/product';
import { useStore } from '@/lib/useStore';
import { cn } from '@/lib/cn';
import type { Category, MenuPageProps, Product } from '@/types';

type Sort = 'featured' | 'best_seller' | 'promo' | 'price_asc' | 'price_desc';

const SORTS: { value: Sort; label: string }[] = [
    { value: 'featured', label: 'Rekomendasi' },
    { value: 'best_seller', label: 'Terlaris' },
    { value: 'promo', label: 'Promo' },
    { value: 'price_asc', label: 'Harga terendah' },
    { value: 'price_desc', label: 'Harga tertinggi' },
];

function clock(value?: string | null): string | null {
    if (!value) return null;

    const [hour, minute] = value.split(':');

    return hour && minute ? `${hour}.${minute}` : null;
}

export default function MenuIndex({
    categories,
    cart: initialCart,
    table,
    product: initialProduct,
    cartOpen,
}: MenuPageProps) {
    const { cart, itemCount, syncCart, openCart, addItem } = useCart();
    const store = useStore();

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sort, setSort] = useState<Sort>('featured');
    const [query, setQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [storeOpen, setStoreOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<Product | null>(initialProduct);

    useEffect(() => {
        syncCart(initialCart);
    }, [initialCart, syncCart]);

    useEffect(() => {
        if (cartOpen) openCart();
    }, [cartOpen, openCart]);

    const allProducts = useMemo(
        () => categories.flatMap((category) => category.products),
        [categories],
    );

    const filledCategories = useMemo(
        () => categories.filter((category) => category.products.length > 0),
        [categories],
    );

    const currentCategory = categories.find((category) => category.id === selectedCategory);

    const menuProducts = useMemo(() => {
        let source = selectedCategory === null ? allProducts : (currentCategory?.products ?? []);

        if (sort === 'best_seller') source = source.filter((p) => p.badge === 'best_seller');
        else if (sort === 'promo') source = source.filter((p) => p.badge === 'promo');

        if (sort === 'price_asc') return [...source].sort((a, b) => a.base_price - b.base_price);
        if (sort === 'price_desc') return [...source].sort((a, b) => b.base_price - a.base_price);

        return source;
    }, [selectedCategory, allProducts, currentCategory, sort]);

    const scrollToMenu = () => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const selectCategory = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        window.setTimeout(scrollToMenu, 30);
    };

    const handleQuickAdd = async (
        product: Product,
        variantIds: number[] = defaultVariantIds(product),
        qty = 1,
    ) => {
        if (requiredAddonGroups(product).length > 0) {
            setActiveProduct(product);
            return;
        }

        await addItem({
            product_id: product.id,
            qty,
            variant_ids: variantIds,
        });
    };

    const openHour = clock(store?.opening_time);
    const closeHour = clock(store?.closing_time);
    const hours = openHour && closeHour ? `${openHour}–${closeHour}` : null;
    const openState =
        store?.is_accepting_orders === true
            ? 'Buka sekarang'
            : store?.is_accepting_orders === false
              ? 'Sedang tutup'
              : null;

    return (
        <AppShell>
            <div className="mx-auto flex w-full max-w-[1720px] flex-col lg:flex-row">
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
                    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex max-w-xl flex-1 items-center gap-3">
                            <SearchField
                                variant="pill"
                                value={query}
                                onChange={setQuery}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Cari kopi, pastry, makanan..."
                                className="min-w-0 flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                className="bg-brand hover:bg-brand-hover inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-warm-sm transition-all active:scale-95"
                            >
                                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                                Filter
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStoreOpen(true)}
                            className="flex items-center gap-3 self-end rounded-full border border-line/80 bg-white px-3.5 py-2 text-left shadow-warm-sm sm:self-auto"
                        >
                            <span className="bg-brand-mist text-brand grid size-8 shrink-0 place-items-center rounded-full">
                                <MapPin className="size-4" aria-hidden="true" />
                            </span>
                            <span className="leading-tight">
                                <span className="text-brand-text block text-xs font-bold">
                                    {table ? `Meja ${table.number}` : (store?.name ?? 'Menanti Pagi')}
                                </span>
                                <span className="text-brand flex items-center gap-1.5 text-[11px] font-semibold">
                                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                    {openState ?? 'Menu'}
                                    {hours ? ` · ${hours}` : ''}
                                </span>
                            </span>
                        </button>
                    </header>

                    <section aria-labelledby="catalog-heading" className="mb-5">
                        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                            <h1
                                id="catalog-heading"
                                className="text-brand-text text-2xl font-extrabold tracking-tight sm:text-3xl"
                            >
                                Menu Kopi &amp; Eatery
                            </h1>
                            <p className="text-brand-muted text-xs sm:text-sm">
                                Racikan biji kopi pilihan nusantara ditemani santapan hangat setiap pagi.
                            </p>
                        </div>
                    </section>

                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <nav aria-label="Kategori Menu" className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => selectCategory(null)}
                                className={cn(
                                    'shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-colors sm:text-sm',
                                    selectedCategory === null
                                        ? 'bg-brand text-white shadow-warm-sm'
                                        : 'hover:bg-brand-mist border-line bg-white text-brand-text border font-medium',
                                )}
                                aria-current={selectedCategory === null ? 'page' : undefined}
                            >
                                Semua
                            </button>
                            {filledCategories.map((category) => {
                                const active = selectedCategory === category.id;
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => selectCategory(category.id)}
                                        className={cn(
                                            'shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-colors sm:text-sm',
                                            active
                                                ? 'bg-brand text-white shadow-warm-sm'
                                                : 'hover:bg-brand-mist border-line bg-white text-brand-muted hover:text-brand-text border font-medium',
                                        )}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        {category.name}
                                    </button>
                                );
                            })}
                        </nav>
                        <SortMenu value={sort} onChange={setSort} />
                    </div>

                    <section id="menu" className="scroll-mt-6">
                        {menuProducts.length === 0 ? (
                            <EmptyState
                                className="rule pt-8"
                                icon={<Coffee className="size-6" />}
                                title="Belum ada menu di sini"
                                description="Coba kategori lain atau pilih urutan/filter lainnya."
                            />
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {menuProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onSelect={setActiveProduct}
                                        onAdd={handleQuickAdd}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                <div className="hidden w-[350px] shrink-0 lg:block">
                    <CartPanel table={table} />
                </div>
            </div>

            {itemCount > 0 && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[68px] z-30 mx-auto w-full max-w-[520px] px-4 lg:hidden">
                    <div className="bg-surface/95 border-line pointer-events-auto rounded-2xl border p-3 shadow-warm-md backdrop-blur-md">
                        <button
                            type="button"
                            onClick={openCart}
                            className="flex w-full items-center justify-between gap-3 text-left"
                        >
                            <span className="flex items-center gap-2.5">
                                <span className="bg-brand tabular grid size-7 place-items-center rounded-full text-[11px] font-bold text-white">
                                    {itemCount}
                                </span>
                                <span className="leading-tight">
                                    <span className="text-ink block text-[12.5px] font-bold">
                                        Keranjang Pesanan
                                    </span>
                                    <span className="text-ink-muted block text-[10.5px]">
                                        {itemCount} item dipilih
                                    </span>
                                </span>
                            </span>
                            <span className="tabular text-brand text-[15px] font-bold">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </button>
                        <Link
                            href="/checkout"
                            className="bg-brand hover:bg-brand-hover mt-2.5 flex min-h-10 items-center justify-center gap-2 rounded-full text-[12px] font-bold text-white transition-colors"
                        >
                            Pesan Sekarang
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            )}

            <ProductSheet
                key={activeProduct?.id ?? 'closed'}
                product={activeProduct}
                onClose={() => setActiveProduct(null)}
            />
            <SearchOverlay
                open={searchOpen}
                products={allProducts}
                categories={filledCategories as Category[]}
                onClose={() => setSearchOpen(false)}
                onSelect={(product) => {
                    setSearchOpen(false);
                    setActiveProduct(product);
                }}
            />
            <StoreSheet open={storeOpen} onClose={() => setStoreOpen(false)} />
        </AppShell>
    );
}

function SortMenu({ value, onChange }: { value: Sort; onChange: (value: Sort) => void }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const selectedIndex = SORTS.findIndex((option) => option.value === value);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        const frame = requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, selectedIndex]);

    const choose = (next: Sort) => {
        onChange(next);
        setOpen(false);
        buttonRef.current?.focus();
    };

    const moveFocus = (delta: number) => {
        const current = optionRefs.current.findIndex(
            (element) => element === document.activeElement,
        );
        const start = current === -1 ? selectedIndex : current;
        const next = (start + delta + SORTS.length) % SORTS.length;
        optionRefs.current[next]?.focus();
    };

    return (
        <div
            ref={rootRef}
            className="relative"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setOpen(false);
                }
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className="text-ink-muted hover:text-ink inline-flex min-h-11 shrink-0 items-center gap-2 px-1 text-[13px] font-medium transition-colors"
            >
                {SORTS[selectedIndex]?.label ?? 'Urutkan'}
                <ChevronDown
                    className={cn('size-4 transition-transform', open && 'rotate-180')}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-label="Urutkan menu"
                    className="bg-surface border-line absolute top-full right-0 z-30 mt-2 w-[190px] border py-1"
                >
                    {SORTS.map((option, index) => {
                        const active = option.value === value;

                        return (
                            <li key={option.value} role="option" aria-selected={active}>
                                <button
                                    ref={(element) => {
                                        optionRefs.current[index] = element;
                                    }}
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => choose(option.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'ArrowDown') {
                                            event.preventDefault();
                                            moveFocus(1);
                                        } else if (event.key === 'ArrowUp') {
                                            event.preventDefault();
                                            moveFocus(-1);
                                        } else if (event.key === 'Home') {
                                            event.preventDefault();
                                            optionRefs.current[0]?.focus();
                                        } else if (event.key === 'End') {
                                            event.preventDefault();
                                            optionRefs.current[SORTS.length - 1]?.focus();
                                        }
                                    }}
                                    className={cn(
                                        'flex min-h-10 w-full items-center justify-between gap-2 px-3 text-left text-[13px] transition-colors',
                                        active
                                            ? 'bg-brand-soft text-brand font-semibold'
                                            : 'text-ink hover:bg-canvas',
                                    )}
                                >
                                    {option.label}
                                    {active && <Check className="size-4" aria-hidden="true" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
