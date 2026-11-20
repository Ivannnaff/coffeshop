import type { InputHTMLAttributes } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchFieldProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
> {
    value: string;
    onChange: (value: string) => void;
    onFilterClick?: () => void;
    onClear?: () => void;
    variant?: 'default' | 'embedded' | 'pill';
}

export function SearchField({
    value,
    onChange,
    onFilterClick,
    onClear,
    placeholder = 'Cari kopi favoritmu',
    variant = 'default',
    className,
    ...props
}: SearchFieldProps) {
    return (
        <div className={cn('relative', className)}>
            <Search
                className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2"
                aria-hidden="true"
            />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className={cn(
                    'text-ink placeholder:text-ink-muted/80 rounded-media min-h-11 w-full appearance-none py-2.5 pr-11 pl-10 text-[14px] transition-colors outline-none [&::-webkit-search-cancel-button]:hidden',
                    variant === 'embedded'
                        ? 'bg-canvas focus:ring-brand/25 border-0 focus:ring-2 focus:ring-inset'
                        : variant === 'pill'
                          ? 'border-line bg-white focus:border-brand/60 focus:ring-brand/20 rounded-full border shadow-warm-sm focus:ring-2'
                          : 'border-line bg-surface focus:border-brand/60 focus:ring-brand/20 border focus:ring-2',
                )}
                {...props}
            />
            {value ? (
                <button
                    type="button"
                    onClick={() => {
                        onChange('');
                        onClear?.();
                    }}
                    aria-label="Hapus pencarian"
                    className="text-ink-muted hover:bg-canvas-deep hover:text-ink absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md transition-colors"
                >
                    <X className="size-4" />
                </button>
            ) : onFilterClick ? (
                <button
                    type="button"
                    onClick={onFilterClick}
                    aria-label="Buka filter"
                    className="bg-brand text-surface hover:bg-brand-hover absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md transition-colors"
                >
                    <SlidersHorizontal className="size-4" />
                </button>
            ) : null}
        </div>
    );
}
