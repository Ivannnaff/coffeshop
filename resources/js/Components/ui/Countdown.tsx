import { cn } from '@/lib/cn';

interface CountdownProps {
    formatted: string;
    isWarning: boolean;
    isExpired: boolean;
}

export function Countdown({ formatted, isWarning, isExpired }: CountdownProps) {
    return (
        <div className="text-center">
            <p id="countdown-label" className="text-[13px] text-ink-muted">
                Sisa waktu pembayaran
            </p>
            <p
                role="timer"
                aria-labelledby="countdown-label"
                className={cn(
                    'tabular mt-1 text-4xl font-semibold',
                    isExpired ? 'text-danger' : isWarning ? 'text-warning' : 'text-ink',
                )}
            >
                {formatted}
            </p>
        </div>
    );
}
