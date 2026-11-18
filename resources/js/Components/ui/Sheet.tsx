import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function Sheet({ open, onClose, title, subtitle, children, footer, className }: SheetProps) {
    useEffect(() => {
        if (!open) return;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <button
                type="button"
                aria-label="Tutup panel"
                onClick={onClose}
                className="animate-fade-in bg-ink/40 absolute inset-0 h-full w-full cursor-default"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title ?? 'Panel'}
                className={cn(
                    'animate-sheet-up bg-surface relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-2xl shadow-[0_-8px_40px_-20px_rgba(36,33,27,0.45)] sm:rounded-2xl',
                    className,
                )}
            >
                <div className="flex justify-center pt-2.5">
                    <span className="bg-line h-1 w-9 rounded-full" aria-hidden="true" />
                </div>

                {(title || subtitle) && (
                    <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-1">
                        <div>
                            {title && <h2 className="text-ink text-xl">{title}</h2>}
                            {subtitle && (
                                <p className="text-ink-muted mt-0.5 text-[13px]">{subtitle}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup"
                            className="tap-target text-ink-muted hover:bg-canvas-deep -mr-1 grid size-10 shrink-0 place-items-center rounded-full transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-4">
                    {children}
                </div>

                {footer && (
                    <div className="border-line bg-surface pb-safe border-t border-dashed px-5 pt-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
