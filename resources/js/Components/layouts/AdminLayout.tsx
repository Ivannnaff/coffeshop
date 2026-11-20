import { useState, type ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Calculator,
    Coffee,
    LayoutDashboard,
    Layers,
    LogOut,
    Menu,
    QrCode,
    Store,
    Tags,
    Truck,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { StaffUser } from '@/types/kds';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const NAV: NavItem[] = [
    { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/kasir', label: 'Kasir', icon: Calculator },
    { href: '/admin/produk', label: 'Produk', icon: Coffee },
    { href: '/admin/kategori', label: 'Kategori', icon: Tags },
    { href: '/admin/addon', label: 'Add-on', icon: Layers },
    { href: '/admin/meja', label: 'Meja & QR', icon: QrCode },
    { href: '/admin/toko', label: 'Toko', icon: Store },
    { href: '/admin/pengantaran', label: 'Pengantaran', icon: Truck },
];

export function AdminLayout({ staff, children }: { staff: StaffUser; children: ReactNode }) {
    const { url } = usePage();
    const [expanded, setExpanded] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const isActive = (href: string) =>
        href === '/admin' ? url === '/admin' : url.startsWith(href);
    const initial = staff.name.trim().charAt(0).toUpperCase();

    const navLinks = (wide: boolean, onNavigate?: () => void) => (
        <nav className={cn('flex flex-col', wide ? 'w-full gap-1.5' : 'items-center gap-2')} aria-label="Navigasi admin">
            {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        title={wide ? undefined : label}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'no-tap-highlight transition-colors',
                            wide
                                ? 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold'
                                : 'grid size-11 place-items-center rounded-2xl',
                            active
                                ? 'bg-brand text-white shadow-[0_8px_18px_-12px_rgba(179,90,34,0.85)]'
                                : 'text-ink-muted hover:bg-brand-mist hover:text-ink',
                        )}
                    >
                        <Icon className="size-[19px] shrink-0" aria-hidden="true" />
                        {wide && <span>{label}</span>}
                    </Link>
                );
            })}
        </nav>
    );

    const userBlock = (wide: boolean, onNavigate?: () => void) => (
        <div className={cn('flex', wide ? 'w-full flex-col gap-2' : 'flex-col items-center gap-2')}>
            <div
                className={cn(
                    'bg-brand-soft text-brand flex items-center gap-2.5 rounded-xl font-bold',
                    wide ? 'w-full px-3 py-2.5 text-[12px]' : 'size-9 justify-center text-[12px]',
                )}
            >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/70">
                    {initial}
                </span>
                {wide && (
                    <span className="min-w-0 text-left">
                        <span className="block truncate">{staff.name}</span>
                        <span className="text-brand/70 block text-[10px] font-semibold tracking-[0.12em] uppercase">
                            {staff.role}
                        </span>
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={() => {
                    onNavigate?.();
                    router.post('/logout');
                }}
                title={wide ? undefined : 'Keluar'}
                aria-label="Keluar"
                className={cn(
                    'no-tap-highlight transition-colors',
                    wide
                        ? 'text-ink-muted hover:bg-danger-soft hover:text-danger flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold'
                        : 'text-ink-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-2xl',
                )}
            >
                <LogOut className="size-[19px] shrink-0" aria-hidden="true" />
                {wide && <span>Keluar</span>}
            </button>
        </div>
    );

    const brand = (wide: boolean) => (
        <Link href="/admin" aria-label="Menanti Pagi Admin" className={cn('flex items-center', wide ? 'gap-2.5 px-1' : 'justify-center')}>
            <img src="/images/menanti-logo.png" alt="" className="size-10 rounded-full object-cover" />
            {wide && (
                <span className="leading-none">
                    <span className="text-ink block text-[15px] font-bold">Menanti Pagi</span>
                    <span className="text-ink-muted mt-1 block text-[9px] font-bold tracking-[0.2em] uppercase">
                        Admin
                    </span>
                </span>
            )}
        </Link>
    );

    return (
        <div className="bg-canvas min-h-dvh lg:flex">
            <aside
                className={cn(
                    'border-line/70 bg-surface sticky top-0 hidden h-dvh shrink-0 flex-col border-r py-5 transition-[width] duration-200 lg:flex',
                    expanded ? 'w-[232px] px-3' : 'w-[82px] items-center px-2',
                )}
            >
                <div className={cn('flex w-full items-center', expanded ? 'justify-between px-1' : 'flex-col gap-3')}>
                    {brand(expanded)}
                    <button
                        type="button"
                        onClick={() => setExpanded((value) => !value)}
                        title={expanded ? 'Tutup label navigasi' : 'Tampilkan label navigasi'}
                        aria-label={expanded ? 'Tutup label navigasi' : 'Tampilkan label navigasi'}
                        aria-expanded={expanded}
                        className="text-ink-muted hover:bg-brand-mist hover:text-brand grid size-10 shrink-0 place-items-center rounded-xl transition-colors"
                    >
                        <Menu className="size-[19px]" aria-hidden="true" />
                    </button>
                </div>

                <div className="mt-7 flex-1">{navLinks(expanded)}</div>

                <div className="mb-2">{userBlock(expanded)}</div>
            </aside>

            <div className="min-w-0 flex-1">
                <header className="border-line/70 bg-surface/95 sticky top-0 z-40 border-b backdrop-blur-md">
                    <div className="flex h-14 items-center gap-2.5 px-4">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Buka menu navigasi"
                            className="border-line text-ink-muted hover:text-brand grid size-10 shrink-0 place-items-center rounded-xl border transition-colors lg:hidden"
                        >
                            <Menu className="size-5" aria-hidden="true" />
                        </button>

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="border-line bg-surface text-ink-muted rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Tutup menu navigasi"
                        onClick={() => setDrawerOpen(false)}
                        className="bg-ink/40 absolute inset-0 h-full w-full"
                    />
                    <aside className="bg-surface animate-sheet-up absolute inset-y-0 left-0 flex w-[264px] flex-col px-4 py-5 shadow-warm-lg">
                        <div className="flex items-center justify-between px-1">
                            {brand(true)}
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Tutup menu navigasi"
                                className="text-ink-muted hover:bg-brand-mist hover:text-brand grid size-9 place-items-center rounded-xl transition-colors"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-8 flex-1">{navLinks(true, () => setDrawerOpen(false))}</div>

                        <div className="border-line border-t pt-4">{userBlock(true, () => setDrawerOpen(false))}</div>
                    </aside>
                </div>
            )}
        </div>
    );
}
