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
                    className={`inline-flex shrink-0 items-center rounded-full border border-line bg-surface text-[13px] font-semibold transition-colors duration-200 ${
                        activeId === category.id
                            ? 'border-brand text-brand bg-brand-soft/30'
                            : 'hover:text-ink hover:border-brand/20 hover:bg-brand-soft/10'
                    } px-4 py-2.5`}>
                    <span className="relative z-10">
                        {category.name}
                    </span>
                </button>
            ))}
        </div>
    );
}
