import { cn } from '@/lib/cn';
import type { Category } from '@/types';

interface CategoryTabsProps {
    categories: Category[];
    selectedId: number | null;
    onSelect: (categoryId: number | null) => void;
    variant?: 'default' | 'embedded';
    showAll?: boolean;
}

export function CategoryTabs({
    categories,
    selectedId,
    onSelect,
    variant = 'default',
    showAll = false,
}: CategoryTabsProps) {
    const embedded = variant === 'embedded';

    const tabClass = (active: boolean) =>
        cn(
            'no-tap-highlight inline-flex min-h-10 shrink-0 items-center rounded-full py-1.5 text-[12.5px] font-semibold transition-colors',
            embedded ? 'px-3.5' : 'border px-4',
            active ? 'bg-brand text-surface' : 'text-ink-muted hover:text-ink',
            !embedded && !active && 'border-line bg-surface hover:border-ink/25',
            embedded && !active && 'hover:bg-canvas',
            !embedded && active && 'border-brand shadow-xs',
        );

    return (
        <div
            className={cn(
                'scrollbar-hide flex overflow-x-auto',
                embedded ? 'gap-1' : 'border-line -mx-4 gap-2 border-b px-4 pb-2.5 lg:mx-0 lg:px-0',
            )}
            role="tablist"
            aria-label="Kategori menu"
        >
            {showAll && (
                <button
                    type="button"
                    role="tab"
                    aria-selected={selectedId === null}
                    onClick={() => onSelect(null)}
                    className={tabClass(selectedId === null)}
                >
                    Semua
                </button>
            )}

            {categories.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedId === category.id}
                    onClick={() => onSelect(category.id)}
                    className={tabClass(selectedId === category.id)}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
