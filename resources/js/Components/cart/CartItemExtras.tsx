import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRupiah } from '@/lib/format/currency';
import { useCart } from '@/Context/CartContext';
import type { AddonGroup, CartItem } from '@/types';

export function CartItemExtras({ item }: { item: CartItem }) {
    const { updateItemOptions, pending } = useCart();
    const groups = (item.addon_options ?? []).filter((group) => group.addons.length > 0);

    if (groups.length === 0) {
        return null;
    }

    const selected = new Map(item.addons.map((addon) => [addon.id, addon.qty]));

    const emit = (next: Map<number, number>) => {
        void updateItemOptions(
            item.id,
            [...next.entries()].map(([addonId, qty]) => ({ addon_id: addonId, qty })),
        );
    };

    const groupCount = (group: AddonGroup, map: Map<number, number>) =>
        group.addons.filter((addon) => map.has(addon.id)).length;

    const toggle = (group: AddonGroup, addonId: number) => {
        const next = new Map(selected);
        const active = next.has(addonId);
        const count = groupCount(group, next);
        const required = group.min_select > 0;

        if (active) {
            if (count <= group.min_select) return;
            next.delete(addonId);
        } else {
            if (group.selection_type === 'multiple' && count >= group.max_select) return;

            if (group.selection_type === 'single') {
                for (const addon of group.addons) {
                    next.delete(addon.id);
                }
            }

            next.set(addonId, required ? item.qty : 1);
        }

        emit(next);
    };

    const changeQty = (group: AddonGroup, addonId: number, qty: number) => {
        const next = new Map(selected);
        const target = Math.min(item.qty, Math.max(0, qty));

        if (target < 1) {
            if (groupCount(group, next) <= group.min_select) return;
            next.delete(addonId);
        } else {
            next.set(addonId, target);
        }

        emit(next);
    };

    return (
        <div className="border-line mt-2.5 space-y-2.5 border-t border-dashed pt-2.5">
            {groups.map((group) => {
                const count = groupCount(group, selected);
                const required = group.min_select > 0;

                return (
                    <div key={group.id}>
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-display text-ink-muted flex items-center gap-1.5 text-[12px] italic">
                                {group.name}
                                {required ? (
                                    <span className="bg-accent-soft text-accent rounded-[4px] px-1.5 py-px font-sans text-[9px] font-bold not-italic">
                                        wajib
                                    </span>
                                ) : (
                                    <span className="text-ink-muted/80 font-sans text-[10.5px] not-italic">
                                        {item.qty > 1
                                            ? `· pilih untuk cup mana (${item.qty} cup)`
                                            : '· pilih kalau mau'}
                                    </span>
                                )}
                            </p>
                            <span
                                className={cn(
                                    'tabular shrink-0 text-[10px] font-semibold',
                                    count > 0 ? 'text-brand' : 'text-ink-muted/80',
                                )}
                            >
                                {count > 0
                                    ? `${count} dipilih`
                                    : group.selection_type === 'single'
                                      ? 'Belum dipilih'
                                      : `Maks ${group.max_select}`}
                            </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {group.addons.map((addon) => {
                                const qty = selected.get(addon.id);
                                const active = qty !== undefined;
                                const currentQty = qty ?? 0;
                                const disabled = pending || addon.is_sold_out;
                                const adjustable = active && item.qty > 1 && !required;

                                return (
                                    <div
                                        key={addon.id}
                                        className={cn(
                                            'inline-flex items-center rounded-[6px] border py-1 pr-1.5 pl-1.5 text-[10.5px] font-semibold transition-colors',
                                            active
                                                ? 'border-brand bg-brand text-surface border-solid'
                                                : 'border-line text-ink hover:border-brand/50 hover:bg-brand-mist border-dashed bg-transparent',
                                            disabled && 'opacity-40',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggle(group, addon.id)}
                                            disabled={disabled}
                                            aria-pressed={active}
                                            className="no-tap-highlight inline-flex items-center gap-1.5"
                                        >
                                            <span
                                                className={cn(
                                                    'grid size-3.5 shrink-0 place-items-center rounded-full',
                                                    active
                                                        ? 'bg-surface/20 text-surface'
                                                        : 'bg-canvas-deep text-ink-muted',
                                                )}
                                                aria-hidden="true"
                                            >
                                                {active ? (
                                                    <Check className="size-2.5" strokeWidth={3.5} />
                                                ) : (
                                                    <Plus className="size-2.5" strokeWidth={3.5} />
                                                )}
                                            </span>
                                            {addon.name}
                                            {addon.price_delta > 0 && (
                                                <span
                                                    className={cn(
                                                        'tabular',
                                                        active
                                                            ? 'text-surface/80'
                                                            : 'text-ink-muted',
                                                    )}
                                                >
                                                    +{formatRupiah(addon.price_delta)}
                                                </span>
                                            )}
                                        </button>

                                        {adjustable && (
                                            <span className="ml-1 inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        changeQty(group, addon.id, currentQty - 1)
                                                    }
                                                    disabled={pending}
                                                    aria-label={`Kurangi ${addon.name}`}
                                                    className="no-tap-highlight bg-surface/20 text-surface hover:bg-surface/30 grid size-4 place-items-center rounded-full transition-colors"
                                                >
                                                    <Minus className="size-2.5" strokeWidth={3} />
                                                </button>
                                                <span className="tabular text-surface min-w-3 text-center text-[10px]">
                                                    {currentQty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        changeQty(group, addon.id, currentQty + 1)
                                                    }
                                                    disabled={pending || currentQty >= item.qty}
                                                    aria-label={`Tambah ${addon.name}`}
                                                    className="no-tap-highlight bg-surface/20 text-surface hover:bg-surface/30 grid size-4 place-items-center rounded-full transition-colors disabled:opacity-40"
                                                >
                                                    <Plus className="size-2.5" strokeWidth={3} />
                                                </button>
                                            </span>
                                        )}

                                        {active && !adjustable && currentQty > 1 && (
                                            <span className="tabular text-surface/80 ml-1.5 text-[10px]">
                                                ×{currentQty}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
