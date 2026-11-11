import { Search, X } from 'lucide-react';

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
    return (
        <div className="relative group">
            <label htmlFor="menu-search" className="sr-only">
                Cari menu
            </label>
            <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"
                aria-hidden="true"
            />
            <input
                id="menu-search"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Cari kopi atau cemilan favorit..."
                className="min-h-14 w-full rounded-2xl border border-line bg-surface pl-12 pr-12 text-[15px] shadow-sm transition-all placeholder:text-ink-muted/60 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10 focus-visible:outline-none"
            />
            {value !== '' && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink-muted hover:bg-canvas transition-colors"
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
