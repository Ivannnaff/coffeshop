import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { timelineFor } from '@/lib/order/status';
import type { OrderStatus } from '@/types';

export function StatusTimeline({ status, mode }: { status: OrderStatus; mode: string }) {
    const steps = timelineFor(status, mode);

    return (
        <ol className="flex items-start justify-between gap-1" aria-label="Progres pesanan">
            {steps.map((step, index) => {
                const done = step.state === 'done';
                const current = step.state === 'current';

                return (
                    <li key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full items-center">
                            <span
                                className={cn(
                                    'mx-auto grid size-7 place-items-center rounded-full border-2 transition-colors',
                                    done && 'border-brand bg-brand text-white',
                                    current && 'border-brand bg-surface text-brand',
                                    step.state === 'upcoming' &&
                                        'border-line bg-surface text-ink-muted',
                                )}
                            >
                                {done ? (
                                    <Check className="size-3.5" strokeWidth={3} />
                                ) : (
                                    <span
                                        className={cn(
                                            'size-2 rounded-full',
                                            current ? 'bg-brand' : 'bg-line',
                                        )}
                                    />
                                )}
                            </span>
                        </div>
                        <span
                            className={cn(
                                'text-center text-[12px] leading-tight font-semibold',
                                current ? 'text-brand' : done ? 'text-ink' : 'text-ink-muted',
                            )}
                        >
                            {step.label}
                        </span>
                        {index < steps.length - 1 && <span className="sr-only">,</span>}
                    </li>
                );
            })}
        </ol>
    );
}
