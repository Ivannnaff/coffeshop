import { Product } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format/currency';
import { Badge } from '@/Components/ui/Badge';
import { Plus } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
    const variantDeltas = product.variants.map((variant) => variant.price_delta);
    const hasPaidVariant = variantDeltas.some((delta) => delta > 0);
    const minDelta = variantDeltas.length > 0 ? Math.min(...variantDeltas) : 0;
    const minPrice = product.base_price + Math.max(0, minDelta);

    const initials = product.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={product.is_sold_out}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors hover:shadow-sm hover:border-brand-soft focus-visible:ring-2 focus-visible:ring-brand/50 outline-none ${
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
                        className="h-full w-full object-cover transition-transform duration-500 ease-in-out hover:scale-[105%] transition-transform"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-soft">
                        <span className="font-display text-4xl font-bold text-brand/30 tracking-wider">
                            {initials}
                        </span>
                    </div>
                )}
                
                {/* Subtle badge overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {product.is_sold_out && <Badge tone="sold_out" />}
                    {!product.is_sold_out && product.badge === 'best_seller' && <Badge tone="best_seller" />}
                    {!product.is_sold_out && product.badge === 'promo' && <Badge tone="promo" />}
                </div>
            </div>
            
            <div className="flex flex-1 flex-col justify-between p-4 pt-0">
                <div>
                    <h3 className="font-display text-[17px] font-bold text-ink leading-tight line-clamp-1 tracking-tight mb-1">
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-2">
                            {product.description}
                        </p>
                    )}
                </div>
                
                <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="tabular text-[14px] font-bold text-brand">
                        {hasPaidVariant ? `mulai dari ${formatRupiah(minPrice)}` : formatRupiah(product.base_price)}
                    </p>
                    
                    {!product.is_sold_out && (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-all duration-200 hover:bg-brand-hover">
                            <Plus className="h-5 w-5" aria-hidden="true" />
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}
