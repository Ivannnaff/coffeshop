import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
    primary: 'rounded-full bg-brand text-surface hover:bg-brand-hover',
    secondary: 'rounded-[8px] bg-brand-soft text-brand-deep hover:bg-brand-mist',
    outline: 'rounded-[8px] border border-line bg-transparent text-ink hover:bg-surface',
    ghost: 'rounded-[8px] text-ink-muted hover:bg-canvas-deep/60 hover:text-ink',
    danger: 'rounded-[8px] bg-danger-soft text-danger hover:bg-danger/15',
};

const sizes: Record<ButtonSize, string> = {
    sm: 'min-h-9 px-4 text-[13px]',
    md: 'min-h-11 px-6 text-[14px]',
    lg: 'min-h-12 px-7 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            loading,
            fullWidth,
            disabled,
            children,
            ...props
        },
        ref,
    ) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'no-tap-highlight inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className,
            )}
            {...props}
        >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {children}
        </button>
    ),
);

Button.displayName = 'Button';
