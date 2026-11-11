import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '../menu/ProductCard';
import { CheckoutSummary } from '../checkout/CheckoutSummary';
import { Product } from '@/lib/api/types';

const mockProduct: Product = {
    id: 1,
    category_id: 1,
    name: 'Kopi Susu Pagi',
    slug: 'kopi-susu-pagi',
    description: 'Kopi susu andalan',
    base_price: 18000,
    image_path: null,
    is_sold_out: false,
    is_active: true,
    badge: 'best_seller',
    sort_order: 1,
    variants: [
        {
            id: 1,
            product_id: 1,
            type: 'size',
            name: 'Regular',
            price_delta: 0,
            is_default: true,
            sort_order: 1,
        },
        {
            id: 2,
            product_id: 1,
            type: 'size',
            name: 'Large',
            price_delta: 4000,
            is_default: false,
            sort_order: 2,
        },
    ],
    addon_groups: [],
};

describe('ProductCard', () => {
    it('renders product details and badge', () => {
        const onClick = vi.fn();
        render(<ProductCard product={mockProduct} onClick={onClick} />);

        expect(screen.getByText('Kopi Susu Pagi')).toBeInTheDocument();
        expect(screen.getByText('Best Seller')).toBeInTheDocument();
        expect(screen.getByText('mulai dari Rp18.000')).toBeInTheDocument();
    });

    it('disables click when sold out', async () => {
        const onClick = vi.fn();
        const soldOutProduct = { ...mockProduct, is_sold_out: true };
        render(<ProductCard product={soldOutProduct} onClick={onClick} />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});

describe('CheckoutSummary', () => {
    it('renders subtotal and total correctly for takeaway', () => {
        render(
            <CheckoutSummary
                mode="takeaway"
                subtotal={36000}
                minItemPrice={15000}
                preview={null}
                loading={false}
                error={null}
            />,
        );

        expect(screen.getAllByText('Rp36.000').length).toBeGreaterThan(0);
    });
});
