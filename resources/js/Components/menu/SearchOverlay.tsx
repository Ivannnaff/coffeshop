import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Clock3, Coffee } from 'lucide-react';
import { SearchField } from '@/Components/ui/SearchField';
import { ProductCard } from '@/Components/ui/ProductCard';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Chip } from '@/Components/ui/Chip';
import type { Category, Product } from '@/types';

const HISTORY_KEY = 'menanti.search-history';

function readHistory(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];

        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}

function writeHistory(items: string[]): void {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 6)));
    } catch {
        // Storage bisa tidak tersedia (mode privat); pencarian tetap berjalan.
    }
}

interface SearchOverlayProps {
    open: boolean;
    products: Product[];
    categories: Category[];
    onClose: () => void;
    onSelect: (product: Product) => void;
}

export function SearchOverlay({
    open,
    products,
    categories,
    onClose,
    onSelect,
}: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>(readHistory);

    useEffect(() => {
        if (!open) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', handleKey);
        };
    }, [open, onClose]);

    const suggestions = useMemo(
        () => products.filter((product) => product.badge === 'best_seller').slice(0, 4),
        [products],
    );

    const results = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (term === '') return [];

        return products.filter(
            (product) =>
                product.name.toLowerCase().includes(term) ||
                (product.description ?? '').toLowerCase().includes(term),
        );
    }, [products, query]);

    if (!open) return null;

    const remember = (term: string) => {
        const trimmed = term.trim();
        if (trimmed === '') return;
        const next = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 6);
        setHistory(next);
        writeHistory(next);
    };

    const handleSelect = (product: Product) => {
        remember(query || product.name);
        onSelect(product);
    };

    return createPortal(
        <div className="animate-fade-in bg-canvas lg:bg-ink/40 fixed inset-0 z-[60] lg:p-6">
            <div className="lg:border-line lg:bg-surface mx-auto flex h-dvh w-full max-w-[520px] flex-col lg:mt-[6vh] lg:h-[min(78dvh,720px)] lg:max-w-3xl lg:overflow-hidden lg:rounded-2xl lg:border lg:shadow-[0_20px_60px_-30px_rgba(36,33,27,0.5)]">
                <div className="border-line flex items-center gap-2.5 border-b px-4 pt-4 pb-3 lg:px-6 lg:pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup pencarian"
                        className="border-line bg-surface text-ink grid size-10 shrink-0 place-items-center rounded-[10px] border"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <SearchField
                        autoFocus
                        value={query}
                        onChange={setQuery}
                        placeholder="Cari kopi, matcha, camilan..."
                        className="flex-1"
                        onClear={() => setQuery('')}
                    />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pt-5 pb-10 lg:px-6">
                    {query.trim() === '' ? (
                        <div className="space-y-6">
                            {history.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-ink flex items-center gap-1.5 text-[15px] font-semibold">
                                            <Clock3 className="text-ink-muted size-4" />
                                            Pencarian terakhir
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHistory([]);
                                                writeHistory([]);
                                            }}
                                            className="text-ink-muted hover:text-ink text-xs font-semibold"
                                        >
                                            Hapus semua
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {history.map((term) => (
                                            <Chip key={term} onClick={() => setQuery(term)}>
                                                {term}
                                            </Chip>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {suggestions.length > 0 && (
                                <section>
                                    <h2 className="text-ink flex items-center gap-1.5 text-[15px] font-semibold">
                                        <Coffee className="text-ink-muted size-4" />
                                        Sering dipesan
                                    </h2>
                                    <div className="mt-3 space-y-2">
                                        {suggestions.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                layout="row"
                                                product={product}
                                                onSelect={handleSelect}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h2 className="text-ink text-[15px] font-semibold">
                                    Jelajahi kategori
                                </h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <Chip
                                            key={category.id}
                                            onClick={() => setQuery(category.name)}
                                        >
                                            {category.name}
                                        </Chip>
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : results.length === 0 ? (
                        <EmptyState
                            icon={<Coffee className="size-7" />}
                            title="Menu tidak ditemukan"
                            description={`Tidak ada hasil untuk “${query}”. Coba kata kunci lain.`}
                        />
                    ) : (
                        <div className="space-y-2">
                            <p className="text-ink-muted text-xs font-medium">
                                {results.length} hasil untuk “{query}”
                            </p>
                            {results.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    layout="row"
                                    product={product}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
