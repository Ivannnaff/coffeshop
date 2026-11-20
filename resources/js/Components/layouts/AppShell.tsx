import { useState, type ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Clock3, Home, LayoutGrid, MapPin, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/Context/CartContext';
import { CartSheet } from '@/Components/cart/CartSheet';
import { StoreSheet } from '@/Components/store/StoreSheet';
import { Sheet } from '@/Components/ui/Sheet';
import { clearRecentOrders, listRecentOrders, type RecentOrder } from '@/lib/history/orders';
import { statusMeta, toneClasses } from '@/lib/order/status';

interface AppShellProps {
    children: ReactNode;
    nav?: boolean;
    className?: string;
}

export function AppShell({ children, nav = true, className }: AppShellProps) {
    const [storeOpen, setStoreOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const { itemCount, openCart } = useCart();
    const { url } = usePage();
    const onMenuPage = url === '/' || url.startsWith('/?');

    const navItemClass =
        'no-tap-highlight relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors';
    const inactiveNav = 'text-ink-muted hover:text-brand';

    const openHistory = () => {
        setRecentOrders(listRecentOrders());
        setHistoryOpen(true);
    };

    const scrollToMenu = () => {
        if (onMenuPage) {
            document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        window.location.href = '/#menu';
    };

    return (
        <div className="bg-canvas min-h-dvh lg:flex">
            <DesktopSidebar
                onOpenStore={() => setStoreOpen(true)}
                onOpenCart={openCart}
                onOpenHistory={openHistory}
                onScrollMenu={scrollToMenu}
                itemCount={itemCount}
            />

            <div className={cn('bg-canvas min-w-0 flex-1', className)}>
                <div className={nav ? 'pb-28 lg:pb-0' : ''}>{children}</div>
            </div>

            {nav && (
                <nav
                    className="bg-surface/95 border-line fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden"
                    aria-label="Navigasi utama"
                >
                    <div className="pb-safe mx-auto grid w-full max-w-[520px] grid-cols-4 gap-1 px-3 pt-1.5">
                        <Link
                            href="/"
                            className={cn(
                                navItemClass,
                                onMenuPage ? 'text-brand' : inactiveNav,
                            )}
                            aria-current={onMenuPage ? 'page' : undefined}
                        >
                            <NavIcon active={onMenuPage}>
                                <Home className="size-[19px]" strokeWidth={onMenuPage ? 2.2 : 1.8} />
                            </NavIcon>
                            Beranda
                        </Link>

                        <button type="button" onClick={scrollToMenu} className={cn(navItemClass, inactiveNav)}>
                            <NavIcon active={false}>
                                <LayoutGrid className="size-[19px]" strokeWidth={1.8} />
                            </NavIcon>
                            Menu
                        </button>

                        <button type="button" onClick={openCart} className={cn(navItemClass, inactiveNav)}>
                            <NavIcon active={false}>
                                <span className="relative">
                                    <ShoppingBag className="size-[19px]" strokeWidth={1.8} />
                                    {itemCount > 0 && (
                                        <span className="bg-brand text-white tabular absolute -top-1.5 -right-2 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] leading-[18px] font-bold">
                                            {itemCount > 99 ? '99+' : itemCount}
                                        </span>
                                    )}
                                </span>
                            </NavIcon>
                            Pesanan
                        </button>

                        <button type="button" onClick={() => setStoreOpen(true)} className={cn(navItemClass, inactiveNav)}>
                            <NavIcon active={false}>
                                <Store className="size-[19px]" strokeWidth={1.8} />
                            </NavIcon>
                            Toko
                        </button>
                    </div>
                </nav>
            )}

            <CartSheet />
            <StoreSheet open={storeOpen} onClose={() => setStoreOpen(false)} />

            <Sheet
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title="Riwayat Pesanan"
                subtitle="Pesanan terakhir di perangkat ini"
            >
                {recentOrders.length === 0 ? (
                    <div className="py-12 text-center">
                        <Clock3 className="text-brand mx-auto mb-3 size-6" aria-hidden="true" />
                        <p className="text-brand-text text-sm font-bold">Belum ada riwayat</p>
                        <p className="text-brand-muted mx-auto mt-1 max-w-[260px] text-xs leading-relaxed">
                            Pesanan yang kamu buka akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-2">
                            {recentOrders.map((order) => {
                                const meta = statusMeta(order.status);
                                return (
                                    <li key={order.token}>
                                        <Link
                                            href={`/pesanan/${order.token}`}
                                            onClick={() => setHistoryOpen(false)}
                                            className="border-line hover:bg-brand-mist flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors"
                                        >
                                            <span className="min-w-0">
                                                <span className="text-brand-text block truncate text-sm font-bold">
                                                    #{order.number}
                                                </span>
                                                <span className="text-brand-muted block text-[11px]">
                                                    {new Date(order.savedAt).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </span>
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                    toneClasses[meta.tone],
                                                )}
                                            >
                                                {meta.label}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <button
                            type="button"
                            onClick={() => {
                                clearRecentOrders();
                                setRecentOrders([]);
                            }}
                            className="text-brand-muted hover:text-danger mt-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                        >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Hapus riwayat
                        </button>
                    </>
                )}
            </Sheet>
        </div>
    );
}

function NavIcon({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <span
            className={cn(
                'grid size-9 place-items-center rounded-full transition-colors',
                active ? 'bg-brand-soft text-brand' : '',
            )}
        >
            {children}
        </span>
    );
}

function DesktopSidebar({
    onOpenStore,
    onOpenCart,
    onOpenHistory,
    onScrollMenu,
    itemCount,
}: {
    onOpenStore: () => void;
    onOpenCart: () => void;
    onOpenHistory: () => void;
    onScrollMenu: () => void;
    itemCount: number;
}) {
    const { url } = usePage();
    const onMenuPage = url === '/' || url.startsWith('/?');

    const itemClass =
        'text-ink-muted hover:bg-white/80 hover:text-brand flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors';

    return (
        <aside className="bg-brand-mist border-line hidden shrink-0 flex-col justify-between px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[250px] lg:border-r">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <span className="bg-brand text-white grid size-10 shrink-0 place-items-center rounded-2xl shadow-warm-sm">
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
                            <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
                            <path d="M8 3.5c-.5.8-.5 1.5 0 2M12 3.5c-.5.8-.5 1.5 0 2" strokeLinecap="round" />
                        </svg>
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="text-brand-text text-[17px] font-extrabold tracking-tight">
                            Menanti Pagi
                        </span>
                        <span className="text-brand-muted text-[10px] font-semibold tracking-[0.14em] uppercase">
                            Coffee &amp; Eatery
                        </span>
                    </span>
                </div>

                <nav aria-label="Menu Utama" className="flex flex-col gap-1.5">
                    <Link href="/" className={cn(itemClass, onMenuPage && 'bg-brand-light/70 text-brand-dark font-bold')}>
                        <Home className="size-[18px] shrink-0" aria-hidden="true" />
                        <span>Beranda</span>
                    </Link>

                    <button
                        type="button"
                        onClick={onScrollMenu}
                        className={cn(
                            itemClass,
                            'text-brand-dark bg-brand-light/70 relative justify-between font-bold shadow-sm',
                        )}
                        aria-current="page"
                    >
                        <span className="flex items-center gap-3.5">
                            <span className="bg-brand absolute top-1/2 left-0 h-6 w-1.5 -translate-y-1/2 rounded-r-full" aria-hidden="true" />
                            <LayoutGrid className="text-brand size-[18px] shrink-0" aria-hidden="true" />
                            <span>Menu</span>
                        </span>
                        <span className="bg-brand rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                            Katalog
                        </span>
                    </button>

                    <button type="button" onClick={onOpenCart} className={itemClass}>
                        <ShoppingBag className="size-[18px] shrink-0" aria-hidden="true" />
                        <span>Pesanan</span>
                        {itemCount > 0 && (
                            <span className="tabular bg-brand ml-auto grid size-5 place-items-center rounded-full text-[11px] font-bold text-white">
                                {itemCount > 99 ? '99+' : itemCount}
                            </span>
                        )}
                    </button>

                    <button type="button" onClick={onOpenStore} className={itemClass}>
                        <MapPin className="size-[18px] shrink-0" aria-hidden="true" />
                        <span>Info Toko</span>
                    </button>

                    <button type="button" onClick={onOpenHistory} className={itemClass}>
                        <Clock3 className="size-[18px] shrink-0" aria-hidden="true" />
                        <span>Riwayat</span>
                    </button>
                </nav>
            </div>
        </aside>
    );
}
