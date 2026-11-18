import { useState, type ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, LayoutGrid, MapPin, ShoppingBag, Store } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCart } from '@/Context/CartContext';
import { useStore } from '@/lib/useStore';
import { formatRupiah } from '@/lib/format/currency';
import { CartSheet } from '@/Components/cart/CartSheet';
import { StoreSheet } from '@/Components/store/StoreSheet';

interface AppShellProps {
    children: ReactNode;
    nav?: boolean;
    className?: string;
}

export function AppShell({ children, nav = true, className }: AppShellProps) {
    const [storeOpen, setStoreOpen] = useState(false);
    const { itemCount, openCart } = useCart();
    const { url } = usePage();
    const onMenuPage = url === '/' || url.startsWith('/?');

    const navItemClass =
        'no-tap-highlight relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors';

    const scrollToMenu = () => {
        if (onMenuPage) {
            document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        window.location.href = '/#menu';
    };

    return (
        <div className="bg-canvas min-h-dvh">
            <DesktopHeader onOpenStore={() => setStoreOpen(true)} onOpenCart={openCart} />

            <div
                className={cn(
                    'bg-canvas relative mx-auto w-full max-w-[520px] md:max-w-3xl lg:min-h-[calc(100dvh-68px)] lg:max-w-7xl lg:px-8',
                    className,
                )}
            >
                <div className={nav ? 'pb-28 lg:pb-0' : 'pb-8 lg:pb-12'}>{children}</div>

                {nav && (
                    <nav
                        className="border-line bg-surface fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
                        aria-label="Navigasi utama"
                    >
                        <div className="pb-safe mx-auto grid w-full max-w-[520px] grid-cols-4 gap-1 px-2 pt-1 md:max-w-3xl">
                            <Link
                                href="/"
                                className={cn(
                                    navItemClass,
                                    onMenuPage ? 'text-brand' : 'text-ink-muted hover:text-ink',
                                )}
                                aria-current={onMenuPage ? 'page' : undefined}
                            >
                                <NavIcon active={onMenuPage}>
                                    <Home
                                        className="size-[19px]"
                                        strokeWidth={onMenuPage ? 2.2 : 1.8}
                                    />
                                </NavIcon>
                                Beranda
                            </Link>

                            <button
                                type="button"
                                onClick={scrollToMenu}
                                className={cn(navItemClass, 'text-ink-muted hover:text-ink')}
                            >
                                <NavIcon active={false}>
                                    <LayoutGrid className="size-[19px]" strokeWidth={1.8} />
                                </NavIcon>
                                Menu
                            </button>

                            <button
                                type="button"
                                onClick={openCart}
                                className={cn(navItemClass, 'text-ink-muted hover:text-ink')}
                            >
                                <NavIcon active={false}>
                                    <span className="relative">
                                        <ShoppingBag className="size-[19px]" strokeWidth={1.8} />
                                        {itemCount > 0 && (
                                            <span className="bg-accent text-surface absolute -top-1.5 -right-2 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] leading-[18px] font-bold">
                                                {itemCount > 99 ? '99+' : itemCount}
                                            </span>
                                        )}
                                    </span>
                                </NavIcon>
                                Keranjang
                            </button>

                            <button
                                type="button"
                                onClick={() => setStoreOpen(true)}
                                className={cn(navItemClass, 'text-ink-muted hover:text-ink')}
                            >
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
            </div>
        </div>
    );
}

function NavIcon({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <span
            className={cn(
                'grid size-9 place-items-center rounded-full transition-colors',
                active ? 'bg-brand text-surface' : 'text-ink-muted',
            )}
        >
            {children}
        </span>
    );
}

function DesktopHeader({
    onOpenStore,
    onOpenCart,
}: {
    onOpenStore: () => void;
    onOpenCart: () => void;
}) {
    const store = useStore();
    const { cart, itemCount } = useCart();
    const { url } = usePage();
    const onMenuPage = url === '/' || url.startsWith('/?');
    const onCheckout = url.startsWith('/checkout');

    const linkClass =
        'relative inline-flex min-h-11 items-center px-1 text-[13px] font-semibold text-ink-muted transition-colors hover:text-ink';

    const handleMenuClick = (event: React.MouseEvent) => {
        if (!onMenuPage) return;
        event.preventDefault();
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <header className="border-line bg-surface sticky top-0 z-40 hidden border-b lg:block">
            <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-9 px-8">
                <Link
                    href="/"
                    className="flex items-center gap-3"
                    aria-label="Menanti Pagi, ke beranda"
                >
                    <img
                        src="/images/menanti-logo.png"
                        alt="Menanti Pagi"
                        className="size-10 rounded-full object-cover"
                    />
                    <span className="flex flex-col leading-none">
                        <span className="font-display text-ink text-[19px] font-semibold tracking-tight">
                            Menanti Pagi
                        </span>
                        <span className="font-display text-ink-muted mt-1 text-[11px] italic">
                            coffee &amp; eatery
                        </span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6" aria-label="Navigasi utama">
                    <Link
                        href="/"
                        className={cn(linkClass, onMenuPage && 'text-ink')}
                        aria-current={onMenuPage ? 'page' : undefined}
                    >
                        Beranda
                        {onMenuPage && (
                            <span
                                className="bg-brand absolute inset-x-0 bottom-0 h-[2px]"
                                aria-hidden="true"
                            />
                        )}
                    </Link>
                    <Link href="/#menu" onClick={handleMenuClick} className={linkClass}>
                        Menu
                    </Link>
                    <button type="button" onClick={onOpenStore} className={linkClass}>
                        Toko
                    </button>
                    {onCheckout && (
                        <span className="text-ink relative inline-flex min-h-11 items-center text-[13px] font-semibold">
                            Checkout
                            <span
                                className="bg-brand absolute inset-x-0 bottom-0 h-[2px]"
                                aria-hidden="true"
                            />
                        </span>
                    )}
                </nav>

                <div className="ml-auto flex items-center gap-5">
                    <button
                        type="button"
                        onClick={onOpenStore}
                        className="text-ink-muted hover:text-ink hidden max-w-[280px] items-center gap-2 text-left transition-colors xl:flex"
                    >
                        <MapPin className="text-brand size-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                            <span className="block truncate text-[12px] font-semibold">
                                {store?.name ?? 'Menanti Pagi'}
                            </span>
                            <span className="block truncate text-[10.5px]">
                                {store?.address ?? 'Lokasi toko'}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenCart}
                        className="bg-brand text-surface hover:bg-brand-hover inline-flex min-h-11 items-center gap-2.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition-colors"
                    >
                        <ShoppingBag className="size-4" aria-hidden="true" />
                        Keranjang
                        <span className="bg-surface/20 tabular grid min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] leading-5 font-bold">
                            {itemCount > 99 ? '99+' : itemCount}
                        </span>
                        {itemCount > 0 && (
                            <span className="tabular text-surface/85">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
