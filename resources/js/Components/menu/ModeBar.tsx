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
            <div className="flex items-center gap-4 rounded-xl border border-brand-soft bg-brand-soft px-6 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                    <Coffee className="h-5 w-5" />
                </div>
                <span className="font-display text-sm font-semibold text-brand">
                    Dine-in di meja {table?.number ?? ''}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[12px] font-medium uppercase tracking-wider text-ink-muted mb-1">Pilih cara pengambilan</p>
            <div className="flex gap-1 rounded-full border border-line bg-surface" role="group" aria-label="Mode pesanan">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={mode === option.value}
                        disabled={pending}
                        onClick={() => onChange(option.value)}
                        className={`flex-1 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                            mode === option.value
                                ? 'border-brand text-white bg-brand-soft'
                                : 'text-ink-muted hover:text-ink hover:border-brand/20 hover:bg-brand-soft/20'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
