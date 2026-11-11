import { cn } from '@/lib/cn';

type BadgeTone = 'best_seller' | 'promo' | 'sold_out';

const tones: Record<BadgeTone, string> = {
    best_seller: 'bg-brand-soft text-brand',
    promo: 'bg-accent text-white',
    sold_out: 'bg-ink text-white',
};

const labels: Record<BadgeTone, string> = {
    best_seller: 'Best Seller',
    promo: 'Promo',
    sold_out: 'Habis',
};

export function Badge({ tone }: { tone: BadgeTone }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                tones[tone],
            )}
        >
            {labels[tone]}
        </span>
    );
}
