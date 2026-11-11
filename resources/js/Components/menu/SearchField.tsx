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
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted transition-colors"
                aria-hidden="true"
            />
            <input
                id="menu-search"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Cari minuman atau snack..."
                className="min-h-14 w-full rounded-xl border border-line bg-surface pl-11 pr-11 text-[15px] transition-all placeholder:text-ink-muted/50 focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 focus-visible:outline-none"
            />
            {value !== '' && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas/30 transition-colors"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
