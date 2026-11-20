import { Head, useForm } from '@inertiajs/react';
import { LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import type { LoginPageProps } from '@/types/kds';

const HIGHLIGHTS = [
    'Antrean otomatis diperbarui setiap 10 detik',
    'Pisahkan pesanan baru, disiapkan, siap, dan diantar',
    'Catatan dan add-on tampil jelas untuk barista',
];

export default function Login({ demo }: LoginPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk staf" />
            <div className="bg-canvas grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
                <aside className="slip relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
                    <div className="slip-line pointer-events-none absolute inset-x-10 top-1/3 xl:inset-x-14" />
                    <div className="slip-line pointer-events-none absolute inset-x-10 bottom-24 xl:inset-x-14" />

                    <div className="relative flex items-center gap-3">
                        <img
                            src="/images/menanti-logo.png"
                            alt=""
                            className="size-12 rounded-full object-cover"
                        />
                        <div className="leading-none">
                            <p className="text-surface text-[19px] font-semibold">Menanti Pagi</p>
                            <p className="text-surface/50 mt-1.5 text-[9px] font-semibold tracking-[0.28em] uppercase">
                                Coffee &amp; Eatery
                            </p>
                        </div>
                    </div>

                    <div className="relative max-w-[520px] py-12">
                        <p className="text-brand-soft text-[11px] font-semibold tracking-[0.18em] uppercase">
                            Area staf · Menanti Pagi
                        </p>
                        <h2 className="text-balance text-surface mt-4 text-[clamp(2.4rem,4vw,3.4rem)]">
                            Dari pesanan masuk ke cangkir.
                        </h2>
                        <p className="text-surface/60 mt-5 max-w-[420px] text-[13.5px] leading-relaxed">
                            Papan dapur menampilkan setiap pesanan yang sudah dibayar, lengkap
                            dengan catatan pelanggan. Tandai progres agar pelanggan tahu pesanannya
                            sedang disiapkan.
                        </p>

                        <ul className="mt-9 max-w-[420px]">
                            {HIGHLIGHTS.map((item, index) => (
                                <li
                                    key={item}
                                    className="slip-line flex gap-4 py-3 text-[13px] text-surface/80 first:pt-0"
                                >
                                    <span className="text-brand-soft tabular shrink-0 text-[11px] font-semibold">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-[11px] text-surface/40">
                        Akses khusus staf. Semua perubahan status tercatat.
                    </p>
                </aside>

                <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                    <div className="w-full max-w-[380px]">
                        <div className="rule mb-8 flex items-center gap-2.5 pb-5 lg:hidden">
                            <img
                                src="/images/menanti-logo.png"
                                alt=""
                                className="size-10 rounded-full object-cover"
                            />
                            <div className="leading-none">
                                <p className="text-ink text-xl font-semibold">Menanti Pagi</p>
                                <p className="text-ink-muted mt-1 text-[9px] font-semibold tracking-[0.22em] uppercase">
                                    Staff access
                                </p>
                            </div>
                        </div>

                        <p className="section-label inline-flex items-center gap-1.5">
                            <LockKeyhole className="size-3" aria-hidden="true" />
                            Area staf
                        </p>
                        <h1 className="text-ink mt-3 text-[32px]">Masuk ke papan dapur</h1>
                        <p className="text-ink-muted mt-2 text-[13px] leading-relaxed">
                            Gunakan akun barista atau admin yang diberikan pemilik toko.
                        </p>

                        <form onSubmit={submit} className="mt-8 space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                placeholder="nama@menanti.test"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                error={errors.email}
                                disabled={processing}
                            />

                            <Input
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Masukkan password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                error={errors.password}
                                disabled={processing}
                            />

                            <Button type="submit" size="lg" fullWidth loading={processing} className="mt-1">
                                <Mail className="size-4" aria-hidden="true" />
                                Masuk
                            </Button>
                        </form>

                        {demo && (
                            <section aria-label="Akun demo lokal" className="rule mt-8 pt-4">
                                <p className="section-label">Akun demo lokal</p>
                                <div className="mt-2">
                                    {[
                                        { label: 'Barista', email: demo.barista },
                                        { label: 'Admin', email: demo.admin },
                                    ].map((account) => (
                                        <button
                                            key={account.label}
                                            type="button"
                                            onClick={() =>
                                                setData({
                                                    email: account.email,
                                                    password: demo.password,
                                                })
                                            }
                                            className="rule text-ink hover:text-brand -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 px-2 py-2.5 text-left text-[12px] transition-colors"
                                        >
                                            <span className="font-semibold">{account.label}</span>
                                            <span className="text-ink-muted">{account.email}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-ink-muted mt-3 text-[11px]">
                                    Password:{' '}
                                    <span className="text-ink font-semibold">{demo.password}</span>
                                </p>
                            </section>
                        )}

                        <p className="text-ink-muted mt-7 text-center text-[11px]">
                            Pelanggan?{' '}
                            <a
                                href="/"
                                className="text-brand font-semibold underline-offset-2 hover:underline"
                            >
                                Kembali ke menu
                            </a>
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
