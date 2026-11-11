import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
    primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-hover',
    secondary: 'border border-brand bg-surface text-brand hover:bg-brand-soft',
    ghost: 'text-brand hover:bg-brand-soft',
    danger: 'text-danger hover:bg-danger/10',
};

const sizes: Record<Size, string> = {
    md: 'min-h-12 px-5 text-[15px]',
    sm: 'min-h-11 px-3 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={props.type ?? 'button'}
            className={cn(base, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading ? 'Memproses...' : children}
        </button>
    );
});
