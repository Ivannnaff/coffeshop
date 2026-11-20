import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, hint, error, className, id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;
        const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-ink block text-[13px] font-semibold">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'border-line bg-surface text-ink placeholder:text-ink-muted/70 rounded-media w-full border px-3.5 py-2.5 text-[14px] transition-colors',
                        'focus:border-brand focus:ring-brand/15 focus:ring-2 focus:outline-none',
                        'disabled:bg-canvas-deep disabled:text-ink-muted',
                        error && 'border-danger/60 focus:border-danger focus:ring-danger/15',
                        className,
                    )}
                    {...props}
                />
                {error ? (
                    <p id={`${inputId}-error`} className="text-danger text-xs font-medium">
                        {error}
                    </p>
                ) : hint ? (
                    <p id={`${inputId}-hint`} className="text-ink-muted text-xs">
                        {hint}
                    </p>
                ) : null}
            </div>
        );
    },
);

Input.displayName = 'Input';
