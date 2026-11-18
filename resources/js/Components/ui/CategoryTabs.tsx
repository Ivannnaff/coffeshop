import { cn } from '@/lib/cn';
import type { Category } from '@/types';

interface CategoryTabsProps {
    categories: Category[];
    selectedId: number | null;
    onSelect: (categoryId: number) => void;
}

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
    return (
        <div
            className="scrollbar-hide border-line -mx-4 flex gap-6 overflow-x-auto border-b px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0"
            role="tablist"
            aria-label="Kategori menu"
        >
            {categories.map((category) => {
                const active = selectedId === category.id;

                return (
                    <button
                        key={category.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(category.id)}
                        className={cn(
                            'no-tap-highlight relative inline-flex min-h-11 shrink-0 items-center pt-2 pb-2.5 text-[13.5px] font-semibold transition-colors',
                            active ? 'text-ink' : 'text-ink-muted hover:text-ink',
                        )}
                    >
                        {category.name}
                        <span
                            className={cn(
                                'absolute inset-x-0 -bottom-px h-[2px] transition-colors',
                                active ? 'bg-brand' : 'bg-transparent',
                            )}
                            aria-hidden="true"
                        />
                    </button>
                );
            })}
        </div>
    );
}
