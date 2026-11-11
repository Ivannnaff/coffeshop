import { Category, Product } from '@/lib/api/types';
import { ProductCard } from './ProductCard';

interface MenuGridProps {
    categories: Category[];
    onProductClick: (product: Product) => void;
}

export function MenuGrid({ categories, onProductClick }: MenuGridProps) {
    return (
        <div className="flex flex-col gap-8">
            {categories.map((category) => (
                <section key={category.id} id={`category-${category.id}`} aria-labelledby={`category-title-${category.id}`}>
                    <h2
                        id={`category-title-${category.id}`}
                        className="mb-3 font-display text-xl font-semibold text-ink"
                    >
                        {category.name}
                    </h2>
                    {category.products.length === 0 ? (
                        <p className="text-[15px] text-ink-muted">Belum ada menu di kategori ini.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {category.products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => onProductClick(product)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}
