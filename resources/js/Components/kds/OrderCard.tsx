import { Clock3, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { cn } from '@/lib/cn';
import { formatAddons } from '@/lib/utils';
import type { KdsAction, StaffOrder } from '@/types/kds';

const MODE = {
    dine_in: { label: 'Dine in', icon: UtensilsCrossed },
    takeaway: { label: 'Takeaway', icon: ShoppingBag },
    delivery: { label: 'Delivery', icon: Truck },
} as const;

const ACCENT: Record<string, string> = {
    PAID: 'border-l-warning',
    PREPARING: 'border-l-brand',
    READY: 'border-l-success',
    OUT_FOR_DELIVERY: 'border-l-ink',
};

function actionFor(order: StaffOrder): { action: KdsAction; label: string } | null {
    switch (order.status) {
        case 'PAID':
            return { action: 'start', label: 'Mulai seduh' };
        case 'PREPARING':
            return { action: 'ready', label: 'Tandai siap' };
        case 'READY':
            return order.mode === 'delivery'
                ? { action: 'dispatch', label: 'Kirim pesanan' }
                : { action: 'complete', label: 'Selesaikan' };
        case 'OUT_FOR_DELIVERY':
            return { action: 'deliver', label: 'Selesai diantar' };
        default:
            return null;
    }
}

function elapsedMinutes(now: number, iso: string | null): number {
    if (!iso) return 0;

    return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

interface OrderCardProps {
    order: StaffOrder;
    now: number;
    busy: boolean;
    onAction: (action: KdsAction) => void;
}

export function OrderCard({ order, now, busy, onAction }: OrderCardProps) {
    const meta = MODE[order.mode];
    const ModeIcon = meta.icon;
    const minutes = elapsedMinutes(now, order.paid_at ?? order.created_at);
    const action = actionFor(order);

    const timerTone =
        minutes >= 10
            ? 'bg-danger-soft text-danger'
            : minutes >= 5
              ? 'bg-warning-soft text-warning'
              : 'bg-brand-soft text-brand';

    const location =
        order.mode === 'dine_in'
            ? `Meja ${order.table_number ?? '—'}`
            : order.mode === 'takeaway'
              ? 'Bungkus · ambil di kasir'
              : [order.delivery_zone_name, order.delivery_address].filter(Boolean).join(' · ');

    return (
        <article
            className={cn(
                'animate-fade-in border-line/70 bg-surface rounded-2xl border border-l-[3px] p-3.5 shadow-[0_2px_10px_-8px_rgba(24,33,28,0.4)]',
                ACCENT[order.status],
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-ink-muted flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] uppercase">
                        {order.status === 'PAID' && (
                            <span
                                className="bg-warning size-1.5 animate-pulse rounded-full"
                                aria-hidden="true"
                            />
                        )}
                        #{order.order_number}
                    </p>
                    <p className="text-ink mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold">
                        <ModeIcon className="text-ink-muted size-3.5 shrink-0" />
                        {meta.label}
                        <span className="text-ink-muted">·</span>
                        <span className="truncate">{order.customer_name}</span>
                    </p>
                </div>
                <span
                    className={cn(
                        'tabular inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold',
                        timerTone,
                    )}
                >
                    <Clock3 className="size-3" />
                    {minutes === 0 ? 'baru' : `${minutes} mnt`}
                </span>
            </div>

            <p className="text-ink-muted mt-1.5 truncate text-[11px]">{location}</p>

            <ul className="border-line/60 mt-3 space-y-2 border-t pt-3">
                {order.items.map((item, index) => {
                    const details = [
                        item.size_name,
                        item.temperature_name,
                        formatAddons(item.addons),
                    ]
                        .filter(Boolean)
                        .join(' · ');

                    return (
                        <li key={`${item.product_name}-${index}`} className="flex gap-2">
                            <span className="bg-brand-soft text-brand mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold">
                                {item.qty}×
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-ink text-[12.5px] leading-snug font-semibold">
                                    {item.product_name}
                                </p>
                                {details && (
                                    <p className="text-ink-muted text-[10.5px] leading-snug">
                                        {details}
                                    </p>
                                )}
                                {item.note && (
                                    <p className="bg-warning-soft text-warning mt-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium">
                                        “{item.note}”
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {order.pickup_note && (
                <p className="bg-canvas-deep text-ink mt-2.5 rounded-lg px-2.5 py-1.5 text-[11px]">
                    <span className="font-semibold">Catatan: </span>
                    {order.pickup_note}
                </p>
            )}

            {action && (
                <div className="mt-3">
                    <Button
                        size="sm"
                        fullWidth
                        loading={busy}
                        onClick={() => onAction(action.action)}
                    >
                        {action.label}
                    </Button>
                </div>
            )}
        </article>
    );
}
