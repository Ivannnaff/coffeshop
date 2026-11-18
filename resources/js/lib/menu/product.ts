import type { AddonGroup, Product } from '@/types';
import { catalogImages } from './catalog-images';

export function resolveImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path;
    }

    return `/storage/${path.replace(/^storage\//, '')}`;
}

/**
 * Foto stok sementara sampai foto asli toko diunggah. Dipilih per kata kunci
 * supaya minuman dan makanan tidak memakai gambar yang sama semua.
 */
const placeholderImages: [RegExp, string][] = [
    [/matcha/i, '/images/products/matcha.jpg'],
    [/choco|chocolate|red velvet|taro/i, '/images/products/choco.jpg'],
    [/milkshake|shake|cookies/i, '/images/products/milkshake.jpg'],
    [/tea|lychee|berry|squash/i, '/images/products/tea.jpg'],
    [/nasi|kimbab|indomie|rice/i, '/images/products/rice.jpg'],
    [/spaghetti|pasta|aglio|bolognese|carbonara/i, '/images/products/pasta.jpg'],
    [/dimsum|siomay/i, '/images/products/dimsum.jpg'],
    [/sandwich|roti/i, '/images/products/sandwich.jpg'],
    [/fries|nugget|kulit|platter/i, '/images/products/fries.jpg'],
    [/americano|iced|cold brew/i, '/images/products/iced-coffee.jpg'],
    [/coffee|kopi|latte|cappuccino|moccacino|aren|caramel|vanilla|hazelnut|butterscotch/i, '/images/products/coffee.jpg'],
];

export function placeholderProductImage(name: string): string | null {
    for (const [pattern, url] of placeholderImages) {
        if (pattern.test(name)) return url;
    }

    return null;
}

export function resolveProductImage(product: Product): string | null {
    return (
        product.image_url ??
        resolveImageUrl(product.image_path) ??
        catalogImages[product.slug] ??
        placeholderProductImage(product.name)
    );
}

export function defaultVariantIds(product: Product): number[] {
    const byType = new Map<string, number>();

    for (const variant of product.variants) {
        if (variant.is_default) {
            byType.set(variant.type, variant.id);
        }
    }

    for (const variant of product.variants) {
        if (!byType.has(variant.type)) {
            byType.set(variant.type, variant.id);
        }
    }

    return [...byType.values()];
}

export function requiredAddonGroups(product: Product): AddonGroup[] {
    return product.addon_groups.filter((group) => group.min_select > 0);
}

export function needsChoices(product: Product): boolean {
    return product.variants.length > 0 || requiredAddonGroups(product).length > 0;
}

export function isProductOrderable(product: Product): boolean {
    return product.is_active && !product.is_sold_out;
}

export function priceWithExtras(product: Product, variantIds: number[], addonIds: number[]): number {
    const variants = product.variants
        .filter((variant) => variantIds.includes(variant.id))
        .reduce((sum, variant) => sum + variant.price_delta, 0);

    const addons = product.addon_groups
        .flatMap((group) => group.addons)
        .filter((addon) => addonIds.includes(addon.id))
        .reduce((sum, addon) => sum + addon.price_delta, 0);

    return product.base_price + variants + addons;
}
