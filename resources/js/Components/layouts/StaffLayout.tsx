import { Link, router, usePage } from '@inertiajs/react';
import { Calculator, LayoutDashboard, LogOut, MonitorPlay } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { StaffUser } from '@/types/kds';

interface StaffLayoutProps {
    staff: StaffUser;
    children: ReactNode;
    context?: string;
    title?: string;
    subtitle?: string;
}

const NAV = [
    { href: '/kds', label: 'Dapur', icon: MonitorPlay },
    { href: '/kasir', label: 'Kasir', icon: Calculator },
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
];

export function StaffLayout({
    staff,
    children,
    context = 'Kitchen Display',
    title = 'Kitchen Display',
    subtitle = 'Papan pesanan barista',
}: StaffLayoutProps) {
    const { url } = usePage();
    const initial = staff.name.trim().charAt(0).toUpperCase();
    const isAdmin = staff.role === 'admin';
    const navItems = NAV.filter((item) => item.href !== (isAdmin ? '/kds' : '/admin'));
    const homeHref = isAdmin ? '/admin' : '/kds';

    const isActive = (href: string) => url === href || url.startsWith(`${href}/`);

    return (
        <div className="min-h-dvh bg-canvas lg:flex">
            <aside className="sticky top-0 hidden h-dvh w-[78px] shrink-0 flex-col items-center border-r border-line/70 bg-surface lg:flex">
                <Link
                    href={homeHref}
                    aria-label={isAdmin ? 'Admin Menanti Pagi' : 'Kitchen Display'}
                    className="mt-5"
                >
                    <img
                        src="/images/menanti-logo.png"
                        alt="Menanti Pagi"
                        className="size-11 rounded-full object-cover"
                    />
                </Link>

                <nav className="mt-7 flex flex-1 flex-col items-center gap-2" aria-label="Navigasi staf">
                    {navItems.map(({ href, label, icon: Icon }) => {
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
                <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/95 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-6">
                        <Link
                            href={homeHref}
                            className="flex items-center gap-2.5 lg:hidden"
                            aria-label={isAdmin ? 'Admin Menanti Pagi' : 'Kitchen Display'}
                        >
                            <img
                                src="/images/menanti-logo.png"
                                alt="Menanti Pagi"
                                className="size-9 rounded-full object-cover"
                            />
                            <span className="leading-none">
                                <span className="block text-lg font-bold text-ink">Menanti Pagi</span>
                                <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                                    {context}
                                </span>
                            </span>
                        </Link>

                        <div className="hidden lg:block">
                            <p className="text-[13px] font-bold text-ink">{title}</p>
                            <p className="text-[10.5px] text-ink-muted">{subtitle}</p>
                        </div>

                        <div className="ml-auto flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-[12.5px] font-semibold text-ink">{staff.name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                                    {staff.role}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink-muted transition-colors hover:border-danger/30 hover:text-danger"
                            >
                                <LogOut className="size-3.5" />
                                Keluar
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 md:px-6 lg:pb-12">
                    {children}
                </main>
            </div>

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/95 backdrop-blur-md lg:hidden"
                aria-label="Navigasi staf"
            >
                <div className="mx-auto grid w-full max-w-[520px] grid-cols-3 gap-1 px-2 pb-safe pt-1.5">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold transition-colors',
                                    active ? 'text-brand' : 'text-ink-muted',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon className="size-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                                {label}
                            </Link>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold text-ink-muted transition-colors"
                    >
                        <LogOut className="size-[21px]" strokeWidth={1.9} />
                        Keluar
                    </button>
                </div>
            </nav>
        </div>
    );
}
