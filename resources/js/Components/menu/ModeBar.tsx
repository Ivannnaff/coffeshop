import { Coffee } from 'lucide-react';
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
            <div className="flex items-center gap-3 rounded-2xl border border-brand-soft/50 bg-brand-soft/30 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                    <Coffee className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-brand">
                        Dine-in di meja {table?.number ?? ''}
                    </p>
                    <p className="text-[12px] text-brand-hover/70">Mode meja tidak dapat diubah.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">Cara Pengambilan</span>
            <div className="flex gap-2 p-1 rounded-2xl border border-line bg-surface" role="group" aria-label="Mode pesanan">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={mode === option.value}
                        disabled={pending}
                        onClick={() => onChange(option.value)}
                        className={`inline-flex min-h-12 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-300 ${
                            mode === option.value
                                ? 'bg-brand text-white shadow-sm'
                                : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
