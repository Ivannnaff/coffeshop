import { OrderMode } from '@/lib/api/types';

interface ModeBarProps {
    mode: OrderMode;
    table: { number: string } | null;
    pending: boolean;
    onChange: (mode: 'takeaway' | 'delivery') => void;
}

const options: Array<{ value: 'takeaway' | 'delivery'; label: string }> = [
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' },
];

export function ModeBar({ mode, table, pending, onChange }: ModeBarProps) {
    if (mode === 'dine_in' || table) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-brand-soft bg-brand-soft px-4 py-3">
                <span className="text-sm font-medium text-brand">
                    Dine-in di meja {table?.number ?? ''}
                </span>
                <span className="text-[13px] text-ink-muted">Mode meja tidak dapat diubah.</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[13px] text-ink-muted">Pilih cara pengambilan pesanan</span>
            <div className="flex gap-2" role="group" aria-label="Mode pesanan">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={mode === option.value}
                        disabled={pending}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                            mode === option.value
                                ? 'border-brand bg-brand text-white'
                                : 'border-line bg-surface text-ink hover:border-brand'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
