import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PublicPageHeaderProps {
    title: string;
    meta?: ReactNode;
    action?: ReactNode;
}

export function PublicPageHeader({ title, meta, action }: PublicPageHeaderProps) {
    return (
        <header className="bg-canvas border-line border-b">
            <div className="mx-auto w-full max-w-[1400px] px-4 pt-3 pb-4 md:px-6 lg:px-8">
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <Link
                            href="/"
                            className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            Kembali ke menu
                        </Link>
                        <h1 className="text-ink mt-1 flex flex-wrap items-baseline gap-x-2.5 text-[26px] leading-[1.1] lg:text-[32px]">
                            {title}
                            {meta && (
                                <span className="text-ink-muted font-sans text-[12.5px] font-normal">
                                    {meta}
                                </span>
                            )}
                        </h1>
                    </div>
                    {action}
                </div>
            </div>
        </header>
    );
}
