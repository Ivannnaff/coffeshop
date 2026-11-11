import { useState, useMemo } from 'react';
import { Product } from '@/lib/api/types';
import { Sheet } from '@/Components/ui/Sheet';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { formatRupiah } from '@/lib/format/currency';
import { Minus, Plus } from 'lucide-react';

interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
    onAdd: (data: {
        product_id: number;
        variant_ids: number[];
        addon_ids: number[];
        qty: number;
        note?: string | null;
    }) => Promise<unknown>;
}

export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
    const sizeVariants = product ? product.variants.filter((v) => v.type === 'size') : [];
    const tempVariants = product ? product.variants.filter((v) => v.type === 'temperature') : [];

    const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        if (!product) return initial;
        const defaultSize = sizeVariants.find((v) => v.is_default) || sizeVariants[0];
        if (defaultSize) initial['size'] = defaultSize.id;

        const defaultTemp = tempVariants.find((v) => v.is_default) || tempVariants[0];
        if (defaultTemp) initial['temperature'] = defaultTemp.id;
        return initial;
    });

    const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
    const [qty, setQty] = useState<number>(1);
    const [note, setNote] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const calculatedPrice = useMemo(() => {
        if (!product) return 0;
        let price = product.base_price;
        Object.values(selectedVariants).forEach((variantId) => {
            const v = product.variants.find((item) => item.id === variantId);
            if (v) price += v.price_delta;
        });
        selectedAddons.forEach((addonId) => {
            for (const group of product.addon_groups) {
                const a = group.addons.find((item) => item.id === addonId);
                if (a) {
                    price += a.price_delta;
                    break;
                }
            }
        });
        return price * qty;
    }, [product, selectedVariants, selectedAddons, qty]);

    if (!product) return null;

    const handleVariantClick = (type: string, id: number) => {
        setSelectedVariants((prev) => ({ ...prev, [type]: id }));
    };

    const handleAddonChange = (group: Product['addon_groups'][0], addonId: number) => {
        if (group.selection_type === 'single') {
            const groupAddonIds = group.addons.map((a) => a.id);
            setSelectedAddons((prev) => [...prev.filter((id) => !groupAddonIds.includes(id)), addonId]);
        } else {
            setSelectedAddons((prev) => {
                if (prev.includes(addonId)) {
                    return prev.filter((id) => id !== addonId);
                }
                const currentCount = prev.filter((id) => group.addons.some((a) => a.id === id)).length;
                if (group.max_select && currentCount >= group.max_select) {
                    return prev;
                }
                return [...prev, addonId];
            });
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onAdd({
                product_id: product.id,
                variant_ids: Object.values(selectedVariants),
                addon_ids: selectedAddons,
                qty,
                note: note.trim() !== '' ? note.trim() : null,
            });
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={Boolean(product)} onClose={onClose} title={product.name}>
            <div className="flex flex-col gap-5">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-brand-soft">
                    {product.image_path ? (
                        <img src={product.image_path} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center p-4 text-center font-medium text-brand">
                            {product.name}
                        </div>
                    )}
                    {product.is_sold_out && (
                        <div className="absolute top-3 left-3">
                            <Badge tone="sold_out" />
                        </div>
                    )}
                </div>

                {product.description && (
                    <p className="text-[15px] leading-relaxed text-ink-muted">{product.description}</p>
                )}

                {sizeVariants.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-ink">Ukuran (Pilih satu)</label>
                        <div className="flex flex-wrap gap-2">
                            {sizeVariants.map((variant) => {
                                const active = selectedVariants['size'] === variant.id;
                                return (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => handleVariantClick('size', variant.id)}
                                        className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                                            active
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-line bg-surface text-ink hover:border-brand'
                                        }`}
                                    >
                                        {variant.name} {variant.price_delta > 0 ? `(+${formatRupiah(variant.price_delta)})` : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tempVariants.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-ink">Suhu (Pilih satu)</label>
                        <div className="flex flex-wrap gap-2">
                            {tempVariants.map((variant) => {
                                const active = selectedVariants['temperature'] === variant.id;
                                return (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => handleVariantClick('temperature', variant.id)}
                                        className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                                            active
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-line bg-surface text-ink hover:border-brand'
                                        }`}
                                    >
                                        {variant.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {product.addon_groups.map((group) => {
                    const groupAddons = group.addons;

                    return (
                        <div key={group.id} className="flex flex-col gap-2 border-t border-line pt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-ink">{group.name}</label>
                                <span className="text-[13px] text-ink-muted">
                                    {group.selection_type === 'single'
                                        ? 'Pilih satu'
                                        : `Pilih minimal ${group.min_select}, maksimal ${group.max_select}`}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {groupAddons.map((addon) => {
                                    const active = selectedAddons.includes(addon.id);
                                    return (
                                        <button
                                            key={addon.id}
                                            type="button"
                                            disabled={addon.is_sold_out}
                                            onClick={() => handleAddonChange(group, addon.id)}
                                            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
                                                addon.is_sold_out
                                                    ? 'cursor-not-allowed bg-canvas opacity-50 text-ink-muted'
                                                    : active
                                                      ? 'border-brand bg-brand text-white'
                                                      : 'border-line bg-surface text-ink hover:border-brand'
                                            }`}
                                        >
                                            <span>{addon.name}</span>
                                            {addon.price_delta > 0 && (
                                                <span className="tabular text-xs opacity-80">(+{formatRupiah(addon.price_delta)})</span>
                                            )}
                                            {addon.is_sold_out && <span className="text-xs">Habis</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <div className="flex flex-col gap-1.5 border-t border-line pt-4">
                    <label htmlFor="product-note" className="text-sm font-semibold text-ink">
                        Catatan pesanan
                    </label>
                    <input
                        id="product-note"
                        type="text"
                        maxLength={140}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Contoh: jangan pakai es, gula sedikit"
                        className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px]"
                    />
                </div>

                <div className="flex items-center justify-between border-t border-line pt-4">
                    <span className="text-sm font-semibold text-ink">Jumlah</span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            disabled={qty <= 1}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface hover:bg-canvas disabled:opacity-50"
                        >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="tabular w-6 text-center text-base font-semibold">{qty}</span>
                        <button
                            type="button"
                            onClick={() => setQty((q) => Math.min(99, q + 1))}
                            disabled={qty >= 99}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface hover:bg-canvas"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
                <div>
                    <p className="text-[13px] text-ink-muted">Total estimasi</p>
                    <p className="tabular text-lg font-semibold text-brand">{formatRupiah(calculatedPrice)}</p>
                </div>
                <Button
                    type="button"
                    loading={submitting}
                    disabled={product.is_sold_out}
                    onClick={handleSubmit}
                    className="min-w-[180px]"
                >
                    Tambah ke keranjang
                </Button>
            </div>
        </Sheet>
    );
}
