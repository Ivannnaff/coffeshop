import { Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QtyStepperProps {
    value: number;
    onDecrease: () => void;
    onIncrease: () => void;
    disabled?: boolean;
    loading?: boolean;
    size?: 'sm' | 'md';
}

export function QtyStepper({
    value,
    onDecrease,
    onIncrease,
    disabled,
    loading,
    size = 'md',
}: QtyStepperProps) {
    const button = size === 'sm' ? 'size-8' : 'size-10';

    return (
        <div
            className={cn(
                'border-line bg-surface inline-flex items-center gap-1 rounded-[8px] border p-0.5',
                size === 'md' && 'gap-2',
            )}
        >
            <button
                type="button"
                onClick={onDecrease}
                disabled={disabled || loading}
                aria-label="Kurangi jumlah"
                className={cn(
                    'no-tap-highlight text-ink hover:bg-canvas-deep grid place-items-center rounded-md transition-colors disabled:opacity-40',
                    button,
                )}
            >
                <Minus className="size-4" />
            </button>
            <span
                className={cn(
                    'tabular text-ink min-w-5 text-center font-semibold',
                    size === 'sm' ? 'text-sm' : 'text-base',
                )}
            >
                {loading ? <Loader2 className="mx-auto size-4 animate-spin" /> : value}
            </span>
            <button
                type="button"
                onClick={onIncrease}
                disabled={disabled || loading}
                aria-label="Tambah jumlah"
                className={cn(
                    'no-tap-highlight bg-brand text-surface hover:bg-brand-hover grid place-items-center rounded-md transition-colors disabled:opacity-40',
                    button,
                )}
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}
