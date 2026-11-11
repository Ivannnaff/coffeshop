import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { PublicLayout } from '@/Layouts/PublicLayout';
import { Category, Product, Cart } from '@/lib/api/types';
import { ModeBar } from '@/Components/menu/ModeBar';
import { SearchField } from '@/Components/menu/SearchField';
import { CategoryTabs } from '@/Components/menu/CategoryTabs';
import { MenuGrid } from '@/Components/menu/MenuGrid';
import { ProductCard } from '@/Components/menu/ProductCard';
import { ProductModal } from '@/Components/menu/ProductModal';
import { CartDrawer } from '@/Components/cart/CartDrawer';
import { CartContents } from '@/Components/cart/CartContents';
import { useCart } from '@/hooks/useCart';
import { api } from '@/lib/api/endpoints';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface MenuIndexProps {
    categories: Category[];
    cart: Cart;
    table: { id: number; number: string } | null;
    product: Product | null;
    cartOpen: boolean;
}

export default function MenuIndex({
    categories,
    cart: initialCart,
    table,
    product,
    cartOpen,
}: MenuIndexProps) {
    const { cart, pending, addItem, updateQty, removeItem, updateMode } = useCart(initialCart);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(categories[0]?.id ?? null);
    const debouncedQuery = useDebouncedValue(query, 300);
    const isSearching = query.trim().length >= 2;

    useEffect(() => {
        const term = debouncedQuery.trim();
        if (term.length < 2) {
            setResults(null);
            setSearching(false);
            return;
        }

        let cancelled = false;
        setSearching(true);

        api.searchMenu(term)
            .then((data) => {
                if (!cancelled) setResults(data);
            })
            .catch(() => {
                if (!cancelled) setResults([]);
            })
            .finally(() => {
                if (!cancelled) setSearching(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const handleModeChange = async (mode: 'takeaway' | 'delivery') => {
        await updateMode(mode);
    };

    const handleCategorySelect = (id: number) => {
        setActiveCategoryId(id);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(`category-${id}`)?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'start',
        });
    };

    const openProduct = (selected: Product) => router.visit(`/produk/${selected.id}`);
    const closeOverlay = () => router.visit('/');

    return (
        <PublicLayout cart={cart} table={table} onCartToggle={() => router.visit('/keranjang')}>
            <Head title="Menu" />
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                    <div className="flex flex-col gap-6 lg:col-span-8 xl:col-span-9">
                        <ModeBar mode={cart.mode} table={table} pending={pending} onChange={handleModeChange} />
                        <SearchField value={query} onChange={setQuery} />

                        {isSearching ? (
                            <section aria-live="polite" className="flex flex-col gap-4">
                                <p className="text-sm text-ink-muted">
                                    Hasil pencarian &ldquo;{query}&rdquo; ({results?.length ?? 0} menu)
                                </p>
                                {searching ? (
                                    <p className="text-sm text-ink-muted">Mencari menu...</p>
                                ) : results && results.length === 0 ? (
                                    <p className="text-sm text-ink-muted">
                                        Tidak ada menu yang cocok dengan {query}.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                                        {results?.map((item) => (
                                            <ProductCard key={item.id} product={item} onClick={() => openProduct(item)} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : (
                            <>
                                <CategoryTabs
                                    categories={categories}
                                    activeId={activeCategoryId}
                                    onSelect={handleCategorySelect}
                                />
                                <MenuGrid categories={categories} onProductClick={openProduct} />
                            </>
                        )}
                    </div>

                    <aside className="hidden rounded-xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-20 lg:col-span-4 lg:block xl:col-span-3">
                        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Keranjang Belanja</h2>
                        <CartContents
                            cart={cart}
                            onUpdateQty={updateQty}
                            onRemove={removeItem}
                            onCheckout={() => router.visit('/checkout')}
                        />
                    </aside>
                </div>
            </div>

            <ProductModal
                product={product}
                onClose={closeOverlay}
                onAdd={async (data) => {
                    const next = await addItem(data);
                    if (next) closeOverlay();
                    return next;
                }}
            />

            <CartDrawer
                open={cartOpen}
                onClose={closeOverlay}
                cart={cart}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                onCheckout={() => router.visit('/checkout')}
            />
        </PublicLayout>
    );
}
