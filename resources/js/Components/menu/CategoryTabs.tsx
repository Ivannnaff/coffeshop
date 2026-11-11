import { Category } from '@/lib/api/types';

interface CategoryTabsProps {
    categories: Category[];
    activeId: number | null;
    onSelect: (id: number) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    if (categories.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Kategori menu">
            {categories.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={activeId === category.id}
                    onClick={() => onSelect(category.id)}
                    className={`inline-flex shrink-0 items-center rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 ${
                        activeId === category.id
                            ? 'border-brand bg-brand text-white shadow-sm'
                            : 'border-line bg-surface text-ink hover:border-brand/30 hover:bg-brand-soft/30'
                    }`}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
