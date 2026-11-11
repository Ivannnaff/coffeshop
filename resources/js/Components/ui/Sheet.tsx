import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;

        const previous = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const getFocusable = () =>
            Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

        const first = getFocusable()[0];
        first?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== 'Tab') return;

            const items = getFocusable();
            if (items.length === 0) return;

            const firstItem = items[0];
            const lastItem = items[items.length - 1];

            if (event.shiftKey && document.activeElement === firstItem) {
                event.preventDefault();
                lastItem.focus();
            } else if (!event.shiftKey && document.activeElement === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previous?.focus();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40">
            <button
                type="button"
                aria-label="Tutup panel"
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-pointer bg-ink/40"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sheet-title"
                className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-surface shadow-card animate-sheet-up lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none"
            >
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                    <h2 id="sheet-title" className="font-display text-xl font-semibold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-canvas"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
            </div>
        </div>
    );
}
