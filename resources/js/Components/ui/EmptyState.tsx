import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center px-6 py-14 text-center',
                className,
            )}
        >
            {icon && (
                <div className="border-line text-brand mb-4 grid size-14 place-items-center rounded-full border">
                    {icon}
                </div>
            )}
            <h3 className="text-ink text-lg">{title}</h3>
            {description && (
                <p className="text-ink-muted mt-1.5 max-w-[280px] text-sm leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
