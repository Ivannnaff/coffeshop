import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRupiah } from '@/lib/format/currency';
import {
    defaultVariantIds,
    isProductOrderable,
    priceWithExtras,
    resolveProductImage,
} from '@/lib/menu/product';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import type { Product, ProductVariant, VariantType } from '@/types';

interface ProductCardProps {
    product: Product;
    onSelect: (product: Product) => void;
    onQuickAdd?: (product: Product) => void;
    onAdd?: (product: Product, variantIds: number[], qty: number) => void;
    layout?: 'grid' | 'row' | 'rail';
}

const BADGE_LABEL: Record<string, string> = {
    promo: 'Promo',
    best_seller: 'Favorit',
};

export function ProductCard({
    product,
    onSelect,
    onQuickAdd,
    onAdd,
    layout = 'grid',
}: ProductCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const [qty, setQty] = useState(1);
    const [variantIds, setVariantIds] = useState<number[]>(() => defaultVariantIds(product));
    const imageUrl = resolveProductImage(product);
    const orderable = isProductOrderable(product);
    const showImage = Boolean(imageUrl) && !imageFailed;
    const description = product.description ?? '';
    const price = priceWithExtras(product, variantIds, []);

    const variantGroups = product.variants.reduce<Record<string, ProductVariant[]>>(
        (groups, variant) => {
            (groups[variant.type] ??= []).push(variant);
            return groups;
        },
        {},
    );
    const groupEntries = Object.entries(variantGroups) as [VariantType, ProductVariant[]][];
    const hasPaidVariant = product.variants.some((variant) => variant.price_delta > 0);

    const image = (size: number) =>
        showImage ? (
            <img
                src={imageUrl ?? undefined}
                alt={product.name}
                loading="lazy"
                width={size * 2}
                height={size * 2}
                onError={() => setImageFailed(true)}
                className={cn('h-full w-full object-cover', !orderable && 'grayscale')}
            />
        ) : (
            <CoffeeArt seed={product.name} compact />
        );

    const chooseVariant = (variant: ProductVariant) => {
        setVariantIds((current) => {
            const others = current.filter((id) => {
                const candidate = product.variants.find((item) => item.id === id);
                return candidate?.type !== variant.type;
            });
            return [...others, variant.id];
        });
    };

    const add = () => {
        if (!orderable) return;
        if (onAdd) onAdd(product, variantIds, qty);
        else if (onQuickAdd) onQuickAdd(product);
        setQty(1);
    };

    if (layout === 'rail') {
        return (
            <article className="w-[150px] shrink-0">
                <button
                    type="button"
                    onClick={() => onSelect(product)}
                    disabled={!orderable}
                    className="block w-full text-left disabled:opacity-60"
                >
                    <span className="bg-brand-mist rounded-media block aspect-square overflow-hidden">
                        {image(150)}
                    </span>
                    <span className="mt-2 block font-sans text-[13px] leading-snug font-semibold">
                        {product.name}
                    </span>
                    <span className="tabular text-brand mt-1 block text-[13px] font-semibold">
                        {formatRupiah(product.base_price)}
                    </span>
                </button>
            </article>
        );
    }

    if (layout === 'row') {
        return (
            <article className="rule py-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onSelect(product)}
                        disabled={!orderable}
                        aria-label={`Lihat ${product.name}`}
                        className="bg-brand-mist rounded-media size-14 shrink-0 overflow-hidden disabled:opacity-60"
                    >
                        {image(56)}
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect(product)}
                        disabled={!orderable}
                        className="min-w-0 flex-1 text-left disabled:opacity-60"
                    >
                        <span className="flex items-baseline gap-2">
                            <span className="truncate font-sans text-[14px] font-semibold">
                                {product.name}
                            </span>
                            <span className="leader" aria-hidden="true" />
                            <span className="tabular text-brand shrink-0 text-[13px] font-semibold">
                                {formatRupiah(product.base_price)}
                            </span>
                        </span>
                        {description && (
                            <span className="text-ink-muted mt-0.5 block truncate text-[12px]">
                                {description}
                            </span>
                        )}
                        {!orderable && (
                            <span className="text-danger mt-1 block text-[12px] font-semibold">
                                Sedang habis
                            </span>
                        )}
                    </button>

                    {onQuickAdd && orderable && (
                        <button
                            type="button"
                            onClick={() => onQuickAdd(product)}
                            aria-label={`Tambah ${product.name} ke keranjang`}
                            className="tap-target bg-ink text-surface hover:bg-brand grid size-11 shrink-0 place-items-center rounded-full transition-colors"
                        >
                            <Plus className="size-5" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </article>
        );
    }

    return (
        <article className="group flex flex-col justify-between rounded-2xl border border-line/70 bg-white p-4 shadow-warm-sm transition-shadow hover:shadow-warm-md">
            <div>
                <button
                    type="button"
                    onClick={() => onSelect(product)}
                    disabled={!orderable}
                    aria-label={`Lihat ${product.name}`}
                    className="relative mb-3.5 block w-full text-left disabled:opacity-60"
                >
                    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-brand-mist">
                        <span className="block h-full w-full transition-transform duration-300 group-hover:scale-105">
                            {image(400)}
                        </span>
                    </span>
                    {product.badge && orderable && (
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-brand shadow-xs backdrop-blur-xs">
                            {BADGE_LABEL[product.badge] ?? product.badge}
                        </span>
                    )}
                </button>

                <div className="mb-1.5 flex items-start justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onSelect(product)}
                        disabled={!orderable}
                        className="text-brand-text min-w-0 text-left text-base leading-snug font-bold disabled:opacity-60"
                    >
                        {product.name}
                    </button>
                    <span className="tabular text-brand shrink-0 text-base font-extrabold">
                        {formatRupiah(price)}
                    </span>
                </div>

                {description && (
                    <p className="text-brand-muted mb-3 line-clamp-2 text-xs leading-relaxed">
                        {description}
                    </p>
                )}
                {hasPaidVariant && (
                    <p className="text-brand-muted -mt-2 mb-2 text-[10.5px]">
                        Mulai dari {formatRupiah(product.base_price)}
                    </p>
                )}
                {!orderable && (
                    <p className="text-danger mb-2 text-xs font-semibold">Sedang habis</p>
                )}

                {groupEntries.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {groupEntries.map(([type, variants]) => (
                            <div key={type} className="flex flex-wrap items-center gap-2">
                                <span className="text-brand-muted text-[11px] font-semibold">
                                    {type === 'size' ? 'Ukuran:' : type === 'temperature' ? 'Penyajian:' : 'Varian:'}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {variants.map((variant) => {
                                        const active = variantIds.includes(variant.id);
                                        return (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                disabled={!orderable}
                                                aria-pressed={active}
                                                onClick={() => chooseVariant(variant)}
                                                className={cn(
                                                    'no-tap-highlight rounded-full border px-3 py-1 text-xs transition-all disabled:opacity-50',
                                                    active
                                                        ? 'border-brand bg-brand-light text-brand-dark font-bold shadow-xs'
                                                        : 'border-line bg-white text-brand-muted hover:border-brand font-semibold',
                                                )}
                                            >
                                                {variant.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-line/40 flex items-center justify-between gap-3 border-t pt-3">
                <div className="bg-brand-mist border-line/70 flex items-center rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setQty((current) => Math.max(1, current - 1))}
                        disabled={!orderable || qty <= 1}
                        aria-label={`Kurangi ${product.name}`}
                        className="text-brand-muted hover:bg-white hover:text-brand grid size-6 place-items-center rounded text-xs font-bold transition-colors disabled:opacity-40"
                    >
                        <Minus className="size-3" aria-hidden="true" />
                    </button>
                    <span className="tabular text-brand-text w-7 text-center text-xs font-bold">{qty}</span>
                    <button
                        type="button"
                        onClick={() => setQty((current) => current + 1)}
                        disabled={!orderable}
                        aria-label={`Tambah ${product.name}`}
                        className="text-brand-muted hover:bg-white hover:text-brand grid size-6 place-items-center rounded text-xs font-bold transition-colors disabled:opacity-40"
                    >
                        <Plus className="size-3" aria-hidden="true" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={add}
                    disabled={!orderable}
                    className="bg-brand hover:bg-brand-hover active:scale-95 no-tap-highlight flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <Plus className="size-3" aria-hidden="true" />
                    Tambah
                </button>
            </div>
        </article>
    );
}
