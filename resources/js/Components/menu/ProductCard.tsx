import { Product } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format/currency';
import { Badge } from '@/Components/ui/Badge';
import { Coffee } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
    const variantDeltas = product.variants.map((variant) => variant.price_delta);
    const hasPaidVariant = variantDeltas.some((delta) => delta > 0);
    const minDelta = variantDeltas.length > 0 ? Math.min(...variantDeltas) : 0;
    const minPrice = product.base_price + Math.max(0, minDelta);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={product.is_sold_out}
            className={`group flex flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition-shadow hover:shadow-sm ${
                product.is_sold_out ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
            }`}
        >
            <div className="relative aspect-[4/3] w-full bg-brand-soft overflow-hidden">
                {product.image_path ? (
                    <img
                        src={product.image_path}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-soft">
                        <Coffee className="h-8 w-8 text-brand/40" aria-hidden="true" />
                    </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_sold_out && <Badge tone="sold_out" />}
                    {!product.is_sold_out && product.badge === 'best_seller' && <Badge tone="best_seller" />}
                    {!product.is_sold_out && product.badge === 'promo' && <Badge tone="promo" />}
                </div>
            </div>
            <div className="flex flex-1 flex-col justify-between p-3.5">
                <div>
                    <h3 className="font-display text-base font-semibold text-ink line-clamp-1">{product.name}</h3>
                    {product.description && (
                        <p className="mt-1 text-[13px] text-ink-muted line-clamp-2">{product.description}</p>
                    )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <p className="tabular text-sm font-semibold text-brand">
                        {hasPaidVariant ? `mulai dari ${formatRupiah(minPrice)}` : formatRupiah(product.base_price)}
                    </p>
                </div>
            </div>
        </button>
    );
}
