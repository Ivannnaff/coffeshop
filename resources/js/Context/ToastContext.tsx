import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastContextValue {
    push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
    success: 'bg-brand text-surface',
    error: 'bg-danger text-surface',
    info: 'bg-ink text-surface',
};

const toneIcons: Record<ToastTone, ReactNode> = {
    success: <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="size-4 shrink-0" aria-hidden="true" />,
    info: <Info className="size-4 shrink-0" aria-hidden="true" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((message: string, tone: ToastTone = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, tone }]);
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3400);
    }, []);

    return (
        <ToastContext.Provider value={{ push }}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={cn(
                            'animate-fade-in flex w-full max-w-[420px] items-center gap-2.5 rounded-[10px] px-4 py-3 text-sm font-medium shadow-[0_10px_30px_-18px_rgba(36,33,27,0.6)]',
                            toneStyles[toast.tone],
                        )}
                    >
                        {toneIcons[toast.tone]}
                        <span className="leading-snug">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used inside ToastProvider');
    }

    return context;
}
