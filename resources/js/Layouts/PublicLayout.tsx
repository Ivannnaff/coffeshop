import { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
import { formatRupiah } from '@/lib/format/currency';
import { Coffee } from 'lucide-react';
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
            <header className="sticky top-0 z-40 border-b-2 border-line/30 bg-brand text-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-hover text-white shadow-xs font-display font-bold">
                            <Coffee className="h-4 w-4" aria-hidden="true" />
                            M
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold tracking-tight text-white">
                                {store?.name || 'Menanti Pagi'}
                            </p>
                            <p className="text-[12px] font-medium text-brand-soft/80 uppercase tracking-wider">
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

            <main className="flex-1 pb-32 lg:pb-20">{children}</main>

            {cart && itemCount > 0 && onCartToggle && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/20 bg-surface/90 p-4 lg:hidden">
                    <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                {itemCount} item di keranjang
                            </p>
                            <p className="tabular text-base font-bold text-brand">{formatRupiah(cart.subtotal)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onCartToggle}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 font-medium text-white transition-all duration-200 hover:bg-brand-hover active:scale-95"
                        >
                            <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
                            <span className="text-[11px] font-semibold">Lihat Keranjang</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
