import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Coffee, MapPin } from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { CartPanel } from '@/Components/cart/CartPanel';
import { SearchField } from '@/Components/ui/SearchField';
import { CategoryTabs } from '@/Components/ui/CategoryTabs';
import { ProductCard } from '@/Components/ui/ProductCard';
import { EmptyState } from '@/Components/ui/EmptyState';
import { StoreSheet } from '@/Components/store/StoreSheet';
import { ProductSheet } from '@/Components/menu/ProductSheet';
import { SearchOverlay } from '@/Components/menu/SearchOverlay';
import { useCart } from '@/Context/CartContext';
import { formatRupiah } from '@/lib/format/currency';
import { greeting } from '@/lib/utils';
import { defaultVariantIds, needsChoices } from '@/lib/menu/product';
import { useStore } from '@/lib/useStore';
import { cn } from '@/lib/cn';
import type { Category, MenuPageProps, Product } from '@/types';

type Sort = 'featured' | 'best_seller' | 'promo' | 'price_asc' | 'price_desc';

const SORTS: { value: Sort; label: string }[] = [
    { value: 'featured', label: 'Rekomendasi' },
    { value: 'best_seller', label: 'Terlaris' },
    { value: 'promo', label: 'Promo' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'price_desc', label: 'Harga Tertinggi' },
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

    const handleQuickAdd = async (product: Product) => {
        if (needsChoices(product)) {
            setActiveProduct(product);
            return;
        }

        await addItem({
            product_id: product.id,
            qty: 1,
            variant_ids: defaultVariantIds(product),
        });
    };

    const openHour = clock(store?.opening_time);
    const closeHour = clock(store?.closing_time);
    const hours = openHour && closeHour ? `${openHour} - ${closeHour}` : null;
    const openState =
        store?.is_accepting_orders === true
            ? 'Buka sekarang'
            : store?.is_accepting_orders === false
              ? 'Sedang tutup'
              : null;

    return (
        <AppShell>
            <div className="mx-auto w-full max-w-[1560px] px-4 pt-3 lg:px-10 lg:pt-5">
                <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-start lg:gap-6 xl:gap-8">
                    <div className="min-w-0">
                        <header className="border-line bg-surface overflow-hidden rounded-[18px] border">
                            <div className="px-4 pt-4 pb-3.5 lg:px-6 lg:py-5">
                                <p className="font-display text-ink-muted text-[12.5px] leading-none italic">
                                    {greeting()}
                                </p>

                                <h1 className="font-display text-ink mt-1.5 text-[27px] leading-[1.06] md:text-[33px]">
                                    Kopi apa hari ini?
                                </h1>

                                <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11.5px]">
                                    <button
                                        type="button"
                                        onClick={() => setStoreOpen(true)}
                                        className="group text-ink inline-flex items-center gap-1.5 font-semibold"
                                    >
                                        <MapPin
                                            className="text-brand size-3.5 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span className="max-w-[190px] truncate">
                                            {store?.name ?? 'Menanti Pagi'}
                                        </span>
                                        <ChevronDown
                                            className="text-ink-muted size-3.5 shrink-0 transition-transform group-hover:translate-y-0.5"
                                            aria-hidden="true"
                                        />
                                    </button>

                                    <span className="bg-line h-3 w-px" aria-hidden="true" />

                                    <span className="text-ink-muted">
                                        {table
                                            ? `Meja ${table.number} · makan di tempat`
                                            : (store?.address ?? 'Lokasi toko')}
                                    </span>

                                    {openState && (
                                        <>
                                            <span className="bg-line h-3 w-px" aria-hidden="true" />
                                            <span className="text-brand inline-flex items-center gap-1.5 font-semibold">
                                                <span
                                                    className="bg-brand size-1.5 rounded-full"
                                                    aria-hidden="true"
                                                />
                                                {openState}
                                                {hours && (
                                                    <span className="text-ink-muted font-normal">
                                                        {hours}
                                                    </span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </header>

                        <section
                            aria-label="Cari dan filter menu"
                            className="border-line bg-surface mt-3 rounded-[16px] border"
                        >
                            <div className="flex items-center gap-1.5 p-1.5">
                                <SearchField
                                    variant="embedded"
                                    value={query}
                                    onChange={setQuery}
                                    onFocus={() => setSearchOpen(true)}
                                    placeholder="Cari kopi, matcha, camilan"
                                    className="min-w-0 flex-1"
                                />
                                <SortMenu value={sort} onChange={setSort} />
                            </div>

                            <div className="border-line/80 border-t px-1.5 py-1.5">
                                <CategoryTabs
                                    variant="embedded"
                                    categories={filledCategories}
                                    selectedId={selectedCategory}
                                    onSelect={selectCategory}
                                    showAll
                                />
                            </div>
                        </section>

                        <section id="menu" className="mt-4 scroll-mt-4 lg:scroll-mt-24">
                            <h2 className="font-display text-ink text-[20px]">
                                {selectedCategory === null
                                    ? 'Semua Menu'
                                    : (currentCategory?.name ?? 'Menu')}
                                <span className="text-ink-muted ml-2 font-sans text-[11px] font-normal">
                                    {menuProducts.length} menu
                                </span>
                            </h2>

                            {menuProducts.length === 0 ? (
                                <EmptyState
                                    className="border-line bg-surface mt-3 rounded-[14px] border"
                                    icon={<Coffee className="size-6" />}
                                    title="Belum ada menu di sini"
                                    description="Coba kategori lain atau pilih urutan/filter lainnya."
                                />
                            ) : (
                                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]">
                                    {menuProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onSelect={setActiveProduct}
                                            onQuickAdd={handleQuickAdd}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <p className="text-ink-muted pt-6 pb-2 text-[11px] leading-relaxed">
                            Harga sudah termasuk pajak. Pesanan diproses setelah pembayaran
                            diterima.
                        </p>
                    </div>

                    <div className="hidden lg:sticky lg:top-24 lg:block">
                        <CartPanel />
                    </div>
                </div>
            </div>

            {itemCount > 0 && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-30 mx-auto w-full max-w-[520px] px-4 lg:hidden">
                    <button
                        type="button"
                        onClick={openCart}
                        className="bg-brand text-surface pointer-events-auto flex w-full items-center justify-between gap-3 rounded-[12px] px-4 py-3.5 shadow-[0_10px_24px_-16px_rgba(16,48,31,0.9)]"
                    >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <span className="bg-surface/20 tabular grid size-6 place-items-center rounded-full text-[11px] font-bold">
                                {itemCount}
                            </span>
                            Lihat keranjang
                        </span>
                        <span className="tabular text-sm font-semibold">
                            {formatRupiah(cart.subtotal)}
                        </span>
                    </button>
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
                className="text-ink hover:bg-canvas inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[11.5px] font-semibold transition-colors"
            >
                {SORTS[selectedIndex]?.label ?? 'Urutkan'}
                <ChevronDown
                    className={cn(
                        'text-ink-muted size-3.5 transition-transform',
                        open && 'rotate-180',
                    )}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-label="Urutkan menu"
                    className="border-line bg-surface absolute top-full right-0 z-30 mt-1.5 w-[180px] overflow-hidden rounded-[10px] border py-1 shadow-[0_16px_40px_-24px_rgba(36,33,27,0.55)]"
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
                                        'flex min-h-10 w-full items-center justify-between gap-2 px-3 text-left text-[12px] transition-colors',
                                        active
                                            ? 'bg-brand-soft text-brand-deep font-semibold'
                                            : 'text-ink hover:bg-canvas',
                                    )}
                                >
                                    {option.label}
                                    {active && <Check className="size-3.5" aria-hidden="true" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
