import { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
import { formatRupiah } from '@/lib/format/currency';
import { Cart } from '@/lib/api/types';

interface PublicLayoutProps {
    children: ReactNode;
    cart?: Cart | null;
    table?: { number: string } | null;
    onCartToggle?: () => void;
}

const modeLabels: Record<string, string> = {
    dine_in: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
};

export function PublicLayout({ children, cart, table, onCartToggle }: PublicLayoutProps) {
    const { store } = usePage<{ store: { name: string } | null }>().props;
    const itemCount = cart ? cart.items.reduce((sum, item) => sum + item.qty, 0) : 0;

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-ink">
            <header className="sticky top-0 z-30 border-b border-line bg-surface">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div>
                        <p className="font-display text-lg font-semibold text-brand">
                            {store?.name || 'Menanti Pagi'}
                        </p>
                        <p className="text-[13px] text-ink-muted">
                            {table
                                ? `Dine-in di meja ${table.number}`
                                : cart
                                  ? modeLabels[cart.mode] ?? 'Pesan di tempat'
                                  : 'Pesan tanpa antre'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-28 lg:pb-12">{children}</main>

            {cart && itemCount > 0 && onCartToggle && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-4 lg:hidden">
                    <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                        <div>
                            <p className="text-[13px] text-ink-muted">{itemCount} item di keranjang</p>
                            <p className="tabular font-semibold text-brand">{formatRupiah(cart.subtotal)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onCartToggle}
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-hover"
                        >
                            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                            Lihat keranjang
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
