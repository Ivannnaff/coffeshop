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
        <div className="flex min-h-screen flex-col bg-canvas text-ink selection:bg-brand selection:text-white">
            <header className="sticky top-0 z-35 border-b border-brand-hover/20 bg-brand text-white shadow-md backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-hover text-white shadow-inner font-display text-xl font-bold">
                            M
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold tracking-tight text-white">
                                {store?.name || 'Menanti Pagi'}
                            </p>
                            <p className="text-[13px] font-medium text-brand-soft/90">
                                {table
                                    ? `Dine-in di meja ${table.number}`
                                    : cart
                                      ? modeLabels[cart.mode] ?? 'Pesan di tempat'
                                      : 'Pesan tanpa antre'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-32 lg:pb-16">{children}</main>

            {cart && itemCount > 0 && onCartToggle && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/95 p-4 shadow-lg backdrop-blur-lg lg:hidden">
                    <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
                        <div>
                            <p className="text-[12px] font-medium uppercase tracking-wider text-ink-muted">
                                {itemCount} item di keranjang
                            </p>
                            <p className="tabular text-base font-bold text-brand">{formatRupiah(cart.subtotal)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onCartToggle}
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 font-semibold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-95"
                        >
                            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                            <span>Lihat Keranjang</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
