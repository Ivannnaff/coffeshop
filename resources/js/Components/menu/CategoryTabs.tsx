import { Category } from '@/lib/api/types';

interface CategoryTabsProps {
    categories: Category[];
    activeId: number | null;
    onSelect: (id: number) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    if (categories.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible" role="tablist" aria-label="Kategori menu">
            {categories.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={activeId === category.id}
                    onClick={() => onSelect(category.id)}
                    className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                        activeId === category.id
                            ? 'border-brand bg-brand text-white'
                            : 'border-line bg-surface text-ink hover:border-brand'
                    }`}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
