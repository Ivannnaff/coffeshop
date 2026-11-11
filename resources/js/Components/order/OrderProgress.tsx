import { Check } from 'lucide-react';
import { getCurrentStep, getProgressSteps } from '@/lib/order/progress';

interface OrderProgressProps {
    status: string;
    mode: string;
}

export function OrderProgress({ status, mode }: OrderProgressProps) {
    const steps = getProgressSteps(mode);
    const current = getCurrentStep(status, mode);

    if (status === 'EXPIRED') {
        return (
            <div className="rounded-xl border border-line bg-canvas p-4">
                <p className="font-semibold text-ink">Pesanan dibatalkan</p>
                <p className="mt-1 text-sm text-ink-muted">
                    Waktu pembayaran habis dan pesanan dibatalkan otomatis.
                </p>
            </div>
        );
    }

    return (
        <ol className="flex flex-col gap-3">
            {steps.map((step) => {
                const done = current > step.step;
                const active = current === step.step;

                return (
                    <li
                        key={step.step}
                        aria-current={active ? 'step' : undefined}
                        className="flex items-center gap-3"
                    >
                        <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                                done
                                    ? 'border-brand bg-brand text-white'
                                    : active
                                      ? 'border-brand bg-brand-soft text-brand'
                                      : 'border-line bg-surface text-ink-muted'
                            }`}
                        >
                            {done ? <Check className="h-4 w-4" aria-hidden="true" /> : step.step}
                        </span>
                        <span
                            className={`text-sm ${
                                active ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-muted'
                            }`}
                        >
                            {step.label}
                            {done && <span className="sr-only"> (selesai)</span>}
                            {active && <span className="sr-only"> (langkah saat ini)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
