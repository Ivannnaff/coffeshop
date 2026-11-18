import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Coffee, MapPin, ShoppingBag } from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { CartPanel } from '@/Components/cart/CartPanel';
import { SearchField } from '@/Components/ui/SearchField';
import { CategoryTabs } from '@/Components/ui/CategoryTabs';
import { ProductCard } from '@/Components/ui/ProductCard';
import { Chip } from '@/Components/ui/Chip';
import { EmptyState } from '@/Components/ui/EmptyState';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { StoreSheet } from '@/Components/store/StoreSheet';
import { ProductSheet } from '@/Components/menu/ProductSheet';
import { SearchOverlay } from '@/Components/menu/SearchOverlay';
import { useCart } from '@/Context/CartContext';
import { formatRupiah } from '@/lib/format/currency';
import { greeting } from '@/lib/utils';
import { defaultVariantIds, needsChoices, resolveProductImage } from '@/lib/menu/product';
import { useStore } from '@/lib/useStore';
import { cn } from '@/lib/cn';
import type { Category, MenuPageProps, Product } from '@/types';

type Filter = 'all' | 'best_seller' | 'promo';
type Sort = 'featured' | 'price_asc' | 'price_desc';

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'best_seller', label: 'Terlaris' },
    { value: 'promo', label: 'Promo' },
];

const SORTS: { value: Sort; label: string }[] = [
    { value: 'featured', label: 'Rekomendasi' },
    { value: 'price_asc', label: 'Harga terendah' },
    { value: 'price_desc', label: 'Harga tertinggi' },
];

function clock(value?: string | null): string | null {
    if (!value) return null;

    const [hour, minute] = value.split(':');

    return hour && minute ? `${hour}.${minute}` : null;
}

function categoryPhoto(name: string): string {
    const key = name.toLowerCase();

    if (key.includes('tea')) return '/images/products/catalog/lychee-tea.jpg';
    if (key.includes('signature')) return '/images/products/catalog/matcha-frappucino.jpg';
    if (key.includes('milk')) return '/images/products/catalog/taro.jpg';
    if (key.includes('choco')) return '/images/products/catalog/magnum-chocolate.jpg';
    if (key.includes('food')) return '/images/products/catalog/nasi-ayam-jepret.jpg';
    if (key.includes('snack')) return '/images/products/catalog/french-fries.jpg';

    return '/images/products/catalog/cappuccino.jpg';
}

export default function MenuIndex({
    categories,
    cart: initialCart,
    table,
    product: initialProduct,
    cartOpen,
}: MenuPageProps) {
    const { cart, itemCount, syncCart, openCart, changeMode, addItem } = useCart();
    const store = useStore();

    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        categories.find((category) => category.products.length > 0)?.id ?? null,
    );
    const [filter, setFilter] = useState<Filter>('all');
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

    const featuredCategory =
        filledCategories.find((category) => /signature/i.test(category.name)) ?? filledCategories[0];

    const spotlight = featuredCategory?.products[0] ?? null;
    const spotlightImage = spotlight ? resolveProductImage(spotlight) : null;

    const quickCategories = filledCategories.slice(0, 4);

    const currentCategory = categories.find((category) => category.id === selectedCategory);

    const menuProducts = useMemo(() => {
        const list = (currentCategory?.products ?? []).filter(
            (product) => filter === 'all' || product.badge === filter,
        );

        if (sort === 'price_asc') return [...list].sort((a, b) => a.base_price - b.base_price);
        if (sort === 'price_desc') return [...list].sort((a, b) => b.base_price - a.base_price);

        return list;
    }, [currentCategory, filter, sort]);

    const scrollToMenu = () => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const selectCategory = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setFilter('all');
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

    const itemLabel = `${itemCount} item`;

    return (
        <AppShell>
            <div className="mx-auto w-full max-w-[1180px] px-4 pt-4 md:px-6 lg:px-8 lg:pt-7">
                <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
                    <div className="min-w-0">
                        <header>
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-display text-[13px] italic text-ink-muted">
                                    {greeting()}
                                </p>
                                {openState && (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand">
                                        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                                        {openState}
                                        {hours && (
                                            <span className="font-normal text-ink-muted">{hours}</span>
                                        )}
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-1 max-w-[16ch] font-display text-[30px] leading-[1.05] text-ink md:text-[38px] lg:text-[42px]">
                                Kopi apa hari ini?
                            </h1>
                        </header>

                        <section className="mt-4 overflow-hidden rounded-[16px] border border-line bg-surface">
                            <div className="flex items-center gap-3 p-3.5">
                                <button
                                    type="button"
                                    onClick={() => setStoreOpen(true)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-brand">
                                        <MapPin className="size-4" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className="truncate text-[13px] font-semibold text-ink">
                                                {store?.name ?? 'Menanti Pagi'}
                                            </span>
                                            <ChevronDown
                                                className="size-3.5 shrink-0 text-ink-muted"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                                            {table
                                                ? `Meja ${table.number} · makan di tempat`
                                                : (store?.address ?? 'Lokasi toko')}
                                        </span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={openCart}
                                    aria-label={`Buka keranjang, ${itemLabel}`}
                                    className="relative grid size-11 shrink-0 place-items-center rounded-[10px] border border-line bg-canvas text-ink lg:hidden"
                                >
                                    <ShoppingBag className="size-5" aria-hidden="true" />
                                    {itemCount > 0 && (
                                        <span className="absolute -right-1.5 -top-1.5 grid min-w-[19px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[17px] text-surface tabular">
                                            {itemCount > 99 ? '99+' : itemCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="border-t border-line px-2.5 py-2">
                                <div
                                    className="grid grid-cols-3 gap-1"
                                    role="radiogroup"
                                    aria-label="Mode pesanan"
                                >
                                    {(
                                        [
                                            { value: 'delivery', label: 'Delivery' },
                                            { value: 'takeaway', label: 'Pickup' },
                                            { value: 'dine_in', label: 'Dine in' },
                                        ] as const
                                    ).map(({ value, label }) => {
                                        const active = cart.mode === value;
                                        const disabled = value === 'dine_in' && !table && !active;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={active}
                                                disabled={disabled}
                                                onClick={() => changeMode(value)}
                                                title={disabled ? 'Scan QR meja untuk dine in' : undefined}
                                                className={cn(
                                                    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] px-2 text-[12px] font-semibold transition-colors',
                                                    active
                                                        ? 'bg-brand-soft text-brand-deep'
                                                        : 'text-ink-muted hover:bg-canvas hover:text-ink',
                                                    disabled &&
                                                        'opacity-40 hover:bg-transparent hover:text-ink-muted',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        active ? 'bg-brand' : 'bg-ink-muted/50',
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {cart.min_item_price > 0 &&
                                (cart.mode === 'delivery' ? (
                                    <div className="flex min-h-9 items-center border-t border-line px-3.5 text-[10.5px] text-ink-muted">
                                        Minimal antar {formatRupiah(cart.min_item_price)}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => changeMode('delivery')}
                                        className="flex min-h-11 w-full items-center justify-between border-t border-line px-3.5 text-[10.5px] text-ink-muted transition-colors hover:text-ink"
                                    >
                                        <span>Minimal antar {formatRupiah(cart.min_item_price)}</span>
                                        <span className="font-semibold text-brand">Atur</span>
                                    </button>
                                ))}
                        </section>

                        <div className="mt-3">
                            <SearchField
                                value={query}
                                onChange={setQuery}
                                onFocus={() => setSearchOpen(true)}
                                placeholder="Cari kopi, matcha, camilan"
                            />
                        </div>

                        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch lg:gap-3">
                            {spotlight && (
                                <section>
                                    <button
                                        type="button"
                                        onClick={() => setActiveProduct(spotlight)}
                                        aria-label={`Lihat ${spotlight.name}`}
                                        className="relative block min-h-[200px] w-full overflow-hidden rounded-[16px] bg-brand text-left text-surface"
                                    >
                                        <span className="absolute inset-y-0 right-0 w-[46%] p-2.5">
                                            <span className="block h-full w-full overflow-hidden rounded-[10px] border border-surface/15 bg-brand-deep/50">
                                                {spotlightImage ? (
                                                    <img
                                                        src={spotlightImage}
                                                        alt={spotlight.name}
                                                        fetchPriority="high"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <CoffeeArt seed={spotlight.name} />
                                                )}
                                            </span>
                                        </span>

                                        <span className="relative z-10 flex h-full max-w-[58%] flex-col justify-center p-5">
                                            <span className="inline-flex w-fit rounded-[4px] bg-surface/15 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase">
                                                {featuredCategory?.name ?? 'Pilihan'}
                                            </span>
                                            <span className="mt-2 line-clamp-2 font-display text-[24px] leading-[1.1] text-surface">
                                                {spotlight.name}
                                            </span>
                                            <span className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-surface/75">
                                                {spotlight.description ??
                                                    'Diseduh segar setiap pesanan.'}
                                            </span>
                                            <span className="mt-3 flex items-center gap-3">
                                                <span className="text-[15px] font-semibold tabular">
                                                    {formatRupiah(spotlight.base_price)}
                                                </span>
                                                <span className="inline-flex min-h-9 items-center rounded-[8px] bg-surface px-3 text-[12px] font-semibold text-brand-deep">
                                                    Pesan
                                                </span>
                                            </span>
                                        </span>
                                    </button>
                                </section>
                            )}

                            <section className="mt-3 grid grid-cols-4 gap-2 lg:mt-0 lg:grid-cols-2">
                                {quickCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => selectCategory(category.id)}
                                        className="group flex flex-col items-center gap-1.5 rounded-[12px] px-1 py-1.5 transition-colors hover:bg-surface lg:flex-row lg:items-center lg:justify-start lg:gap-2.5 lg:border lg:border-line lg:bg-surface lg:p-2.5 lg:hover:border-brand/40"
                                    >
                                        <span className="bg-canvas-deep block size-14 shrink-0 overflow-hidden rounded-[10px] lg:size-11">
                                            <img
                                                src={categoryPhoto(category.name)}
                                                alt=""
                                                aria-hidden="true"
                                                loading="lazy"
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </span>
                                        <span className="flex min-w-0 flex-col items-center lg:items-start">
                                            <span className="text-ink w-full truncate text-center text-[10.5px] font-semibold lg:text-left">
                                                {category.name}
                                            </span>
                                            <span className="text-ink-muted text-[9.5px]">
                                                {category.products.length} menu
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </section>
                        </div>

                        <section id="menu" className="mt-6 scroll-mt-4 lg:scroll-mt-24">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <h2 className="font-display text-[22px] text-ink">Menu</h2>
                                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                                        {menuProducts.length} menu tersedia
                                    </p>
                                </div>

                                <SortMenu value={sort} onChange={setSort} />
                            </div>

                            <div className="mt-2">
                                <CategoryTabs
                                    categories={filledCategories}
                                    selectedId={selectedCategory}
                                    onSelect={selectCategory}
                                />
                            </div>

                            <div className="mt-3 flex gap-2">
                                {FILTERS.map((option) => (
                                    <Chip
                                        key={option.value}
                                        active={filter === option.value}
                                        onClick={() => setFilter(option.value)}
                                    >
                                        {option.label}
                                    </Chip>
                                ))}
                            </div>

                            {menuProducts.length === 0 ? (
                                <EmptyState
                                    className="mt-4"
                                    icon={<Coffee className="size-6" />}
                                    title="Belum ada menu"
                                    description="Kategori ini belum punya produk yang sesuai filter."
                                />
                            ) : (
                                <div className="mt-1 grid grid-cols-1 gap-x-8 lg:grid-cols-2">
                                    {menuProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            layout="menu"
                                            product={product}
                                            onSelect={setActiveProduct}
                                            onQuickAdd={handleQuickAdd}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <p className="pt-8 pb-2 text-[11px] leading-relaxed text-ink-muted">
                            Harga sudah termasuk pajak. Pesanan diproses setelah pembayaran diterima.
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
                        className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-[12px] bg-brand px-4 py-3.5 text-surface shadow-[0_10px_24px_-16px_rgba(16,48,31,0.9)]"
                    >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            <span className="grid size-6 place-items-center rounded-full bg-surface/20 text-[11px] font-bold tabular">
                                {itemCount}
                            </span>
                            Lihat keranjang
                        </span>
                        <span className="text-sm font-semibold tabular">
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
        const current = optionRefs.current.findIndex((element) => element === document.activeElement);
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
                className="border-line bg-surface text-ink hover:border-brand/40 inline-flex min-h-11 items-center gap-2 rounded-[8px] border px-3 text-[11.5px] font-semibold transition-colors"
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
