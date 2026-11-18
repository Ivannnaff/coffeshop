import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, hint, error, className, id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-ink block text-[13px] font-semibold">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    className={cn(
                        'border-line bg-surface text-ink placeholder:text-ink-muted/70 w-full resize-none rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors',
                        'focus:border-brand focus:ring-brand/15 focus:ring-2 focus:outline-none',
                        error && 'border-danger/60 focus:border-danger focus:ring-danger/15',
                        className,
                    )}
                    {...props}
                />
                {error ? (
                    <p className="text-danger text-xs font-medium">{error}</p>
                ) : hint ? (
                    <p className="text-ink-muted text-xs">{hint}</p>
                ) : null}
            </div>
        );
    },
);

Textarea.displayName = 'Textarea';
