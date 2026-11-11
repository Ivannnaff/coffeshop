import { InputHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/cn';

interface BaseProps {
    label: string;
    error?: string | null;
    hint?: string;
    containerClassName?: string;
}

const fieldClass =
    'w-full min-h-12 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-ink-muted/70 focus-visible:border-brand';

export function TextField({
    label,
    error,
    hint,
    containerClassName,
    id,
    className,
    ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            <label htmlFor={fieldId} className="text-sm font-medium text-ink">
                {label}
            </label>
            <input
                id={fieldId}
                className={cn(fieldClass, error && 'border-danger', className)}
                aria-invalid={error ? true : undefined}
                aria-describedby={cn(error && errorId, hint && hintId) || undefined}
                {...props}
            />
            {hint && !error && (
                <p id={hintId} className="text-[13px] text-ink-muted">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="text-[13px] text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

export function TextArea({
    label,
    error,
    hint,
    containerClassName,
    id,
    className,
    ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            <label htmlFor={fieldId} className="text-sm font-medium text-ink">
                {label}
            </label>
            <textarea
                id={fieldId}
                className={cn(fieldClass, 'min-h-24 py-3', error && 'border-danger', className)}
                aria-invalid={error ? true : undefined}
                aria-describedby={cn(error && errorId, hint && hintId) || undefined}
                {...props}
            />
            {hint && !error && (
                <p id={hintId} className="text-[13px] text-ink-muted">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="text-[13px] text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
