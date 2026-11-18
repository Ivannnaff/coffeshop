import { cn } from '@/lib/cn';

type BadgeTone = 'best_seller' | 'promo' | 'sold_out' | 'new';

const tones: Record<BadgeTone, string> = {
    best_seller: 'bg-brand-soft text-brand',
    promo: 'bg-accent-soft text-accent',
    sold_out: 'bg-ink/10 text-ink-muted',
    new: 'bg-brand-mist text-brand-deep',
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
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                tones[tone],
                className,
            )}
        >
            {label ?? labels[tone]}
        </span>
    );
}
