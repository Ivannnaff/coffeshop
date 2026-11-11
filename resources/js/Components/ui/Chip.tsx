import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
}

export function Chip({ selected = false, className, children, ...props }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            className={cn(
                'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150',
                selected
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-surface text-ink hover:border-brand',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
