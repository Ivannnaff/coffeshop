import { cn } from '@/lib/cn';

type BadgeTone = 'best_seller' | 'promo' | 'sold_out' | 'new';

const tones: Record<BadgeTone, string> = {
    best_seller: 'bg-brand text-surface',
    promo: 'bg-accent text-surface',
    sold_out: 'bg-ink text-surface',
    new: 'bg-warning-soft text-warning',
};

const labels: Record<BadgeTone, string> = {
    best_seller: 'Terlaris',
    promo: 'Promo',
    sold_out: 'Habis',
    new: 'Baru',
};

export function Badge({
    tone,
    label,
    className,
}: {
    tone: BadgeTone;
    label?: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase',
                tones[tone],
                className,
            )}
        >
            {label ?? labels[tone]}
        </span>
    );
}
