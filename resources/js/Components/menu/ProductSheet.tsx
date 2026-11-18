import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Sheet } from '@/Components/ui/Sheet';
import { Button } from '@/Components/ui/Button';
import { QtyStepper } from '@/Components/ui/QtyStepper';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { Textarea } from '@/Components/ui/Textarea';
import { useCart } from '@/Context/CartContext';
import { formatRupiah } from '@/lib/format/currency';
import { priceWithExtras, isProductOrderable, resolveProductImage } from '@/lib/menu/product';
import { cn } from '@/lib/cn';
import type { Addon, AddonGroup, Product, ProductVariant, AddCartItemPayload } from '@/types';

interface ProductSheetProps {
    product: Product | null;
    onClose: () => void;
    onAdd?: (payload: AddCartItemPayload) => Promise<void> | void;
}

function defaultsFor(product: Product): { variants: number[]; addons: number[] } {
    const byType = new Map<string, number>();

    for (const variant of product.variants) {
        if (variant.is_default) byType.set(variant.type, variant.id);
    }
    for (const variant of product.variants) {
        if (!byType.has(variant.type)) byType.set(variant.type, variant.id);
    }

    const addons: number[] = [];
    for (const group of product.addon_groups) {
        if (group.selection_type === 'single' && group.min_select > 0) {
            const first = group.addons.find((addon) => !addon.is_sold_out);
            if (first) addons.push(first.id);
        }
    }

    return { variants: [...byType.values()], addons };
}

export function ProductSheet({ product, onClose, onAdd }: ProductSheetProps) {
    const { addItem } = useCart();
    const [variantIds, setVariantIds] = useState<number[]>(() =>
        product ? defaultsFor(product).variants : [],
    );
    const [addonIds, setAddonIds] = useState<number[]>(() =>
        product ? defaultsFor(product).addons : [],
    );
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState('');
    const [adding, setAdding] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const unitPrice = useMemo(
        () => (product ? priceWithExtras(product, variantIds, addonIds) : 0),
        [product, variantIds, addonIds],
    );

    if (!product) return null;

    const orderable = isProductOrderable(product);
    const imageUrl = resolveProductImage(product);

    const invalidGroups = product.addon_groups.filter((group) => {
        const count = group.addons.filter((addon) => addonIds.includes(addon.id)).length;

        return count < group.min_select || count > group.max_select;
    });

    const blocked = invalidGroups.length > 0 || !orderable;
    const groupedVariants = groupVariants(product.variants);

    const handleSubmit = async () => {
        if (blocked) return;

        const payload: AddCartItemPayload = {
            product_id: product.id,
            variant_ids: variantIds,
            addon_ids: addonIds,
            qty,
            note: note.trim() === '' ? null : note.trim(),
        };

        setAdding(true);

        try {
            if (onAdd) {
                await onAdd(payload);
                onClose();
                return;
            }

            const cart = await addItem(payload);
            if (cart) onClose();
        } finally {
            setAdding(false);
        }
    };

    return (
        <Sheet
            open
            onClose={onClose}
            footer={
                <div className="flex items-center gap-3 pb-1">
                    <QtyStepper
                        value={qty}
                        onDecrease={() => setQty((current) => Math.max(1, current - 1))}
                        onIncrease={() => setQty((current) => Math.min(99, current + 1))}
                    />
                    <Button
                        size="lg"
                        fullWidth
                        loading={adding}
                        disabled={blocked}
                        onClick={handleSubmit}
                    >
                        {blocked ? 'Lengkapi pilihan' : `Tambah · ${formatRupiah(unitPrice * qty)}`}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5 pb-2">
                <div className="border-line bg-canvas-deep relative aspect-[16/9] w-full overflow-hidden rounded-[12px] border">
                    {imageUrl && !imageFailed ? (
                        <img
                            src={imageUrl}
                            alt={product.name}
                            onError={() => setImageFailed(true)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <CoffeeArt seed={product.name} />
                    )}
                    {!orderable && (
                        <div className="bg-ink/45 absolute inset-0 grid place-items-center">
                            <span className="bg-surface text-ink rounded-[6px] px-3 py-1 text-xs font-bold">
                                Sedang habis
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-ink text-2xl">{product.name}</h2>
                    <p className="text-ink-muted mt-1 text-[13.5px] leading-relaxed">
                        {product.description ?? 'Kopi pilihan yang diseduh segar setiap pesanan.'}
                    </p>
                    <p className="tabular text-brand mt-2 text-lg font-semibold">
                        {formatRupiah(unitPrice)}
                    </p>
                </div>

                {groupedVariants.map(([type, variants]) => {
                    const selected = variants.find((variant) => variantIds.includes(variant.id));

                    return (
                        <section
                            key={type}
                            aria-label={type === 'size' ? 'Pilihan ukuran' : 'Pilihan suhu'}
                        >
                            <SectionTitle
                                title={type === 'size' ? 'Ukuran' : 'Suhu'}
                                hint={selected ? selected.name : 'Pilih satu'}
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {variants.map((variant) => {
                                    const active = variantIds.includes(variant.id);

                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() =>
                                                setVariantIds((current) => [
                                                    ...current.filter(
                                                        (id) =>
                                                            !product.variants.some(
                                                                (item) =>
                                                                    item.id === id &&
                                                                    item.type === variant.type,
                                                            ),
                                                    ),
                                                    variant.id,
                                                ])
                                            }
                                            aria-pressed={active}
                                            className={cn(
                                                'rounded-[8px] border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                                                active
                                                    ? 'border-brand bg-brand text-surface'
                                                    : 'border-line text-ink-muted hover:border-ink/25 hover:text-ink bg-transparent',
                                            )}
                                        >
                                            {variant.name}
                                            {variant.price_delta > 0 && (
                                                <span className="ml-1 opacity-80">
                                                    +{formatRupiah(variant.price_delta)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {product.addon_groups.map((group) => (
                    <AddonGroupSection
                        key={group.id}
                        group={group}
                        selectedIds={addonIds}
                        onToggle={(addon) => {
                            if (addon.is_sold_out) return;

                            setAddonIds((current) => {
                                const groupIds = new Set(group.addons.map((item) => item.id));

                                if (current.includes(addon.id)) {
                                    return current.filter((id) => id !== addon.id);
                                }

                                if (group.selection_type === 'single') {
                                    return [...current.filter((id) => !groupIds.has(id)), addon.id];
                                }

                                const count = group.addons.filter((item) =>
                                    current.includes(item.id),
                                ).length;

                                if (count >= group.max_select) return current;

                                return [...current, addon.id];
                            });
                        }}
                    />
                ))}

                <Textarea
                    label="Catatan untuk barista"
                    placeholder="Contoh: es sedikit, gula terpisah"
                    rows={2}
                    maxLength={140}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                />
            </div>
        </Sheet>
    );
}

function groupVariants(variants: ProductVariant[]): [string, ProductVariant[]][] {
    const groups = new Map<string, ProductVariant[]>();

    for (const variant of variants) {
        const list = groups.get(variant.type) ?? [];
        list.push(variant);
        groups.set(variant.type, list);
    }

    return [...groups.entries()];
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="flex items-center justify-between">
            <h3 className="text-ink text-[13px] font-semibold">{title}</h3>
            {hint && <span className="text-ink-muted text-[11.5px]">{hint}</span>}
        </div>
    );
}

function AddonGroupSection({
    group,
    selectedIds,
    onToggle,
}: {
    group: AddonGroup;
    selectedIds: number[];
    onToggle: (addon: Addon) => void;
}) {
    const count = group.addons.filter((addon) => selectedIds.includes(addon.id)).length;
    const required = group.min_select > 0;
    const hint = required
        ? `Pilih minimal ${group.min_select}`
        : group.selection_type === 'single'
          ? 'Pilih satu (opsional)'
          : `Maksimal ${group.max_select}`;

    return (
        <section>
            <div className="flex items-center justify-between">
                <h3 className="text-ink flex items-center gap-1.5 text-[13px] font-semibold">
                    {group.name}
                    {required && (
                        <span className="bg-accent-soft text-accent rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] uppercase">
                            Wajib
                        </span>
                    )}
                </h3>
                <span
                    className={cn(
                        'text-[11.5px]',
                        count < group.min_select ? 'text-danger font-semibold' : 'text-ink-muted',
                    )}
                >
                    {hint}
                </span>
            </div>

            <div className="mt-2 space-y-2">
                {group.addons.map((addon) => {
                    const active = selectedIds.includes(addon.id);
                    const disabled =
                        addon.is_sold_out ||
                        (!active &&
                            group.selection_type === 'multiple' &&
                            count >= group.max_select);

                    return (
                        <button
                            key={addon.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(addon)}
                            aria-pressed={active}
                            className={cn(
                                'flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors',
                                active
                                    ? 'border-brand bg-brand-mist'
                                    : 'border-line hover:border-ink/25 bg-transparent',
                                disabled && 'opacity-45',
                            )}
                        >
                            <span className="flex items-center gap-2.5">
                                <span
                                    className={cn(
                                        'grid size-5 place-items-center rounded-[5px] border transition-colors',
                                        active
                                            ? 'border-brand bg-brand text-surface'
                                            : 'border-line bg-transparent text-transparent',
                                    )}
                                >
                                    <Check className="size-3" strokeWidth={3} />
                                </span>
                                <span className="text-ink text-[13px] font-medium">
                                    {addon.name}
                                    {addon.is_sold_out && (
                                        <span className="text-ink-muted ml-1 text-[11px]">
                                            (habis)
                                        </span>
                                    )}
                                </span>
                            </span>
                            <span className="tabular text-ink-muted text-[12.5px] font-semibold">
                                {addon.price_delta > 0
                                    ? `+${formatRupiah(addon.price_delta)}`
                                    : 'Gratis'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
