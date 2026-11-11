import { Search, X } from 'lucide-react';

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
    return (
        <div className="relative">
            <label htmlFor="menu-search" className="sr-only">
                Cari menu
            </label>
            <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
            />
            <input
                id="menu-search"
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Cari menu"
                className="min-h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-11 text-[15px] placeholder:text-ink-muted/70 focus-visible:border-brand"
            />
            {value !== '' && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
