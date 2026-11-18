import { describe, expect, it } from 'vitest';
import { formatRupiah } from '@/lib/format/currency';
import { statusMeta, timelineFor } from '@/lib/order/status';
import { defaultVariantIds, needsChoices, priceWithExtras } from '@/lib/menu/product';
import { formatAddons } from '@/lib/utils';
import type { Product } from '@/types';

const product: Product = {
    id: 1,
    category_id: 1,
    name: 'Es Kopi Susu',
    slug: 'es-kopi-susu',
    description: null,
    base_price: 14000,
    image_path: null,
    is_sold_out: false,
    is_active: true,
    badge: null,
    sort_order: 0,
    variants: [
        {
            id: 1,
            product_id: 1,
            type: 'size',
            name: 'Regular',
            price_delta: 0,
            is_default: true,
            sort_order: 0,
        },
        {
            id: 2,
            product_id: 1,
            type: 'size',
            name: 'Large',
            price_delta: 4000,
            is_default: false,
            sort_order: 1,
        },
    ],
    addon_groups: [
        {
            id: 1,
            name: 'Sugar Level',
            selection_type: 'single',
            min_select: 1,
            max_select: 1,
            is_active: true,
            addons: [
                {
                    id: 1,
                    addon_group_id: 1,
                    name: 'Normal Sugar',
                    price_delta: 0,
                    is_sold_out: false,
                    is_active: true,
                    sort_order: 0,
                },
            ],
        },
        {
            id: 2,
            name: 'Extra Topping',
            selection_type: 'multiple',
            min_select: 0,
            max_select: 3,
            is_active: true,
            addons: [
                {
                    id: 4,
                    addon_group_id: 2,
                    name: 'Extra Shot',
                    price_delta: 5000,
                    is_sold_out: false,
                    is_active: true,
                    sort_order: 0,
                },
            ],
        },
    ],
};

describe('formatRupiah', () => {
    it('formats integer rupiah without decimals', () => {
        expect(formatRupiah(14000)).toContain('14.000');
        expect(formatRupiah(0)).toContain('0');
    });
});

describe('formatAddons', () => {
    it('marks quantity only when an add-on applies to more than one cup', () => {
        expect(formatAddons([{ name: 'Extra Shot', qty: 1 }])).toBe('Extra Shot');
        expect(formatAddons([{ name: 'Extra Shot', qty: 2 }])).toBe('Extra Shot ×2');
        expect(formatAddons([{ name: 'Extra Shot' }, { name: 'Oreo', qty: 3 }])).toBe(
            'Extra Shot, Oreo ×3',
        );
    });
});

describe('order status helpers', () => {
    it('maps status to label and tone', () => {
        expect(statusMeta('PENDING_PAYMENT').tone).toBe('pending');
        expect(statusMeta('PAID').tone).toBe('success');
        expect(statusMeta('COMPLETED').label).toBe('Selesai');
    });

    it('marks the current and completed timeline steps', () => {
        const steps = timelineFor('PAID', 'takeaway');

        expect(steps[0].state).toBe('done');
        expect(steps[1].state).toBe('current');
        expect(steps[4].state).toBe('upcoming');
    });

    it('uses different final step for delivery mode', () => {
        const steps = timelineFor('READY', 'delivery');

        expect(steps[3].key).toBe('OUT_FOR_DELIVERY');
    });
});

describe('product pricing', () => {
    it('selects one default variant per type', () => {
        expect(defaultVariantIds(product)).toEqual([1]);
    });

    it('adds variant and addon deltas', () => {
        expect(priceWithExtras(product, [2], [4])).toBe(23000);
        expect(priceWithExtras(product, [1], [])).toBe(14000);
    });

    it('knows when a product needs choices', () => {
        expect(needsChoices(product)).toBe(true);
        expect(
            needsChoices({
                ...product,
                variants: [],
                addon_groups: [],
            }),
        ).toBe(false);
    });
});
