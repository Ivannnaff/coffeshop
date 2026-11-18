import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRupiah } from '@/lib/format/currency';
import { resolveProductImage, isProductOrderable } from '@/lib/menu/product';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { Badge } from '@/Components/ui/Badge';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product;
    onSelect: (product: Product) => void;
    onQuickAdd?: (product: Product) => void;
    layout?: 'grid' | 'row' | 'menu' | 'rail';
}

export function ProductCard({ product, onSelect, onQuickAdd, layout = 'grid' }: ProductCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = resolveProductImage(product);
    const orderable = isProductOrderable(product);
    const showImage = Boolean(imageUrl) && !imageFailed;
    const description = product.description ?? 'Kopi pilihan Menanti';

    const image = (compact: boolean) =>
        showImage ? (
            <img
                src={imageUrl ?? undefined}
                alt={product.name}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover"
            />
        ) : (
            <CoffeeArt seed={product.name} compact={compact} />
        );

    if (layout === 'menu') {
        return (
            <article className="border-line/80 border-b last:border-0">
                <div className="flex items-center gap-3 py-3">
                    <button
                        type="button"
                        onClick={() => onSelect(product)}
                        disabled={!orderable}
                        aria-label={`Lihat ${product.name}`}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                        <span className="border-line/80 bg-canvas-deep block size-16 shrink-0 overflow-hidden rounded-[10px] border">
                            {image(true)}
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                                <span className="text-ink truncate font-sans text-[13.5px] leading-tight font-semibold">
                                    {product.name}
                                </span>
                                {product.badge && orderable && <Badge tone={product.badge} />}
                            </span>
                            <span className="text-ink-muted mt-0.5 block truncate text-[11px] leading-snug">
                                {description}
                            </span>
                            <span className="mt-1 block text-[12.5px] font-semibold tabular text-ink">
                                {formatRupiah(product.base_price)}
                            </span>
                            {!orderable && (
                                <span className="text-danger mt-1 inline-flex text-[11px] font-semibold">
                                    Sedang habis
                                </span>
                            )}
                        </span>
                    </button>

                    {onQuickAdd && orderable && (
                        <button
                            type="button"
                            onClick={() => onQuickAdd(product)}
                            aria-label={`Tambah ${product.name} ke keranjang`}
                            className="tap-target border-brand text-brand hover:bg-brand hover:text-surface grid size-11 shrink-0 place-items-center rounded-[10px] border transition-colors"
                        >
                            <Plus className="size-5" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </article>
        );
    }

    if (layout === 'row') {
        return (
            <button
                type="button"
                onClick={() => onSelect(product)}
                disabled={!orderable}
                className={cn(
                    'border-line bg-surface flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors',
                    orderable ? 'hover:border-brand/50' : 'opacity-60',
                )}
            >
                <div className="bg-canvas-deep size-14 shrink-0 overflow-hidden rounded-lg">
                    {image(true)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-ink truncate font-sans text-[13.5px] font-semibold">
                            {product.name}
                        </h3>
                        <span className="leader" aria-hidden="true" />
                        <span className="tabular text-ink shrink-0 text-[12.5px] font-semibold">
                            {formatRupiah(product.base_price)}
                        </span>
                    </div>
                    <p className="text-ink-muted mt-0.5 line-clamp-1 text-[11px]">{description}</p>
                </div>
            </button>
        );
    }

    if (layout === 'rail') {
        return (
            <article className="w-[152px] shrink-0">
                <button
                    type="button"
                    onClick={() => onSelect(product)}
                    disabled={!orderable}
                    className={cn(
                        'border-line bg-surface block w-full overflow-hidden rounded-[12px] border text-left transition-colors',
                        orderable ? 'hover:border-brand/50' : 'opacity-60',
                    )}
                >
                    <span className="relative block aspect-square">
                        {image(false)}
                        {product.badge && orderable && (
                            <span className="absolute top-1.5 left-1.5">
                                <Badge tone={product.badge} />
                            </span>
                        )}
                        {!orderable && (
                            <span className="bg-ink/40 absolute inset-0 grid place-items-center">
                                <span className="bg-surface text-ink rounded-[4px] px-2 py-0.5 text-[10px] font-bold">
                                    Habis
                                </span>
                            </span>
                        )}
                    </span>
                    <span className="block px-2.5 pt-2 pb-2.5">
                        <span className="text-ink line-clamp-2 block font-sans text-[12.5px] leading-snug font-semibold">
                            {product.name}
                        </span>
                        <span className="tabular text-ink mt-1 block text-[12px] font-semibold">
                            {formatRupiah(product.base_price)}
                        </span>
                    </span>
                </button>
            </article>
        );
    }

    return (
        <article
            className={cn(
                'group border-line bg-surface relative flex w-full flex-col overflow-hidden rounded-[10px] border transition-colors',
                orderable ? 'hover:border-brand/50' : 'opacity-70',
            )}
        >
            <div className="relative">
                <button
                    type="button"
                    onClick={() => onSelect(product)}
                    disabled={!orderable}
                    aria-label={`Lihat ${product.name}`}
                    className="block aspect-square w-full"
                >
                    {image(false)}
                </button>

                {product.badge && orderable && (
                    <span className="absolute top-1.5 left-1.5">
                        <Badge tone={product.badge} />
                    </span>
                )}

                {!orderable && (
                    <div className="bg-ink/40 absolute inset-0 grid place-items-center">
                        <span className="bg-surface text-ink rounded-[4px] px-2 py-0.5 text-[10px] font-bold">
                            Habis
                        </span>
                    </div>
                )}

                {onQuickAdd && orderable && (
                    <button
                        type="button"
                        onClick={() => onQuickAdd(product)}
                        aria-label={`Tambah ${product.name} ke keranjang`}
                        className="bg-brand text-surface hover:bg-brand-hover absolute right-1.5 bottom-1.5 grid size-11 place-items-center rounded-[10px] transition-colors"
                    >
                        <Plus className="size-5" />
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={() => onSelect(product)}
                disabled={!orderable}
                aria-label={`Lihat ${product.name}`}
                className="block w-full flex-1 px-2.5 pt-2 pb-2.5 text-left"
            >
                <h3 className="text-ink line-clamp-1 font-sans text-[13px] leading-snug font-semibold">
                    {product.name}
                </h3>
                <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="tabular text-ink text-[13px] font-semibold">
                        {formatRupiah(product.base_price)}
                    </span>
                </div>
            </button>
        </article>
    );
}
