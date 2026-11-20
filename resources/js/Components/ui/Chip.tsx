import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    icon?: ReactNode;
}

export function Chip({ active, icon, children, className, ...props }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'no-tap-highlight inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                active
                    ? 'border-brand bg-brand text-surface'
                    : 'border-line text-ink-muted hover:border-ink/25 hover:text-ink bg-transparent',
                className,
            )}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}
