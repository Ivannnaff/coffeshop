import { Link, router, usePage } from '@inertiajs/react';
import {
    Calculator,
    Coffee,
    LayoutDashboard,
    Layers,
    LogOut,
    QrCode,
    Store,
    Tags,
    Truck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { StaffUser } from '@/types/kds';

const NAV = [
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

    const isActive = (href: string) =>
        href === '/admin' ? url === '/admin' : url.startsWith(href);

    const initial = staff.name.trim().charAt(0).toUpperCase();

    return (
        <div className="min-h-dvh bg-canvas lg:flex">
            <aside className="sticky top-0 hidden h-dvh w-[82px] shrink-0 flex-col items-center border-r border-line/70 bg-surface lg:flex">
                <Link
                    href="/admin"
                    aria-label="Menanti Pagi Admin"
                    className="mt-5"
                >
                    <img
                        src="/images/menanti-logo.png"
                        alt="Menanti Pagi"
                        className="size-11 rounded-full object-cover"
                    />
                </Link>

                <nav className="mt-7 flex flex-1 flex-col items-center gap-2" aria-label="Navigasi admin">
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                title={label}
                                aria-label={label}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'grid size-11 place-items-center rounded-2xl transition-colors',
                                    active
                                        ? 'bg-brand text-white shadow-[0_8px_18px_-12px_rgba(22,163,74,1)]'
                                        : 'text-ink-muted hover:bg-canvas-deep hover:text-ink',
                                )}
                            >
                                <Icon className="size-[19px]" />
                            </Link>
                        );
                    })}
                </nav>

                <div className="mb-4 flex flex-col items-center gap-2">
                    <div
                        title={staff.name}
                        className="grid size-9 place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-hover"
                    >
                        {initial}
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        title="Keluar"
                        aria-label="Keluar"
                        className="grid size-11 place-items-center rounded-2xl text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                        <LogOut className="size-[19px]" />
                    </button>
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur-md lg:hidden">
                    <div className="flex h-14 items-center gap-2.5 px-4">
                        <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-brand text-white">
                            <img
                                src="/images/menanti-logo.png"
                                alt=""
                                className="size-8 object-cover"
                            />
                        </span>
                        <span className="text-lg font-bold text-ink">Menanti Pagi</span>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink-muted"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                    <div className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-2">
                        {NAV.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold',
                                    isActive(href)
                                        ? 'bg-brand text-white'
                                        : 'bg-canvas-deep text-ink-muted',
                                )}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
