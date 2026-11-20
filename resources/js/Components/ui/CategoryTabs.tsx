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
            'no-tap-highlight relative inline-flex min-h-10 shrink-0 items-center py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
            embedded ? 'px-3.5' : 'px-4',
            active ? 'text-brand font-semibold' : 'text-ink-muted hover:text-ink',
            active &&
                'after:bg-brand after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:content-[""]',
        );

    return (
        <div
            className={cn(
                'scrollbar-hide flex overflow-x-auto',
                embedded ? 'gap-0.5' : 'border-line -mx-4 gap-0.5 border-b px-4 lg:mx-0 lg:px-0',
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
