import { ShoppingBag, Truck, UtensilsCrossed, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { OrderMode } from '@/types';

interface ModeBarProps {
    mode: OrderMode;
    onChange: (mode: OrderMode) => void;
    locked?: boolean;
    dark?: boolean;
    className?: string;
}

const MODES: { value: OrderMode; label: string; icon: typeof ShoppingBag }[] = [
    { value: 'delivery', label: 'Delivery', icon: Truck },
    { value: 'dine_in', label: 'Dine in', icon: UtensilsCrossed },
    { value: 'takeaway', label: 'Take away', icon: ShoppingBag },
];

export function ModeBar({ mode, onChange, locked, dark = false, className }: ModeBarProps) {
    return (
        <div
            className={cn(
                'inline-flex w-full gap-1 rounded-full p-1 sm:w-auto',
                dark ? 'bg-espresso-soft' : 'border-line bg-canvas-deep/60 border',
                className,
            )}
            role="radiogroup"
            aria-label="Pilih mode pesanan"
        >
            {MODES.map(({ value, label, icon: Icon }) => {
                const active = mode === value;
                const disabled = (locked && !active) || (value === 'dine_in' && mode !== 'dine_in');

                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        onClick={() => onChange(value)}
                        title={
                            disabled && value === 'dine_in'
                                ? 'Scan QR meja untuk dine in'
                                : undefined
                        }
                        className={cn(
                            'no-tap-highlight inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors sm:flex-none',
                            active
                                ? 'bg-brand text-surface'
                                : dark
                                  ? 'text-surface/60 hover:text-surface'
                                  : 'text-ink-muted hover:bg-surface hover:text-ink',
                            disabled && 'opacity-50 hover:bg-transparent',
                        )}
                    >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {label}
                        {active && locked && (
                            <Lock className="size-3 opacity-70" aria-hidden="true" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
