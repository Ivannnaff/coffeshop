import { Head, useForm } from '@inertiajs/react';
import { LockKeyhole, Mail, MonitorCheck } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import type { LoginPageProps } from '@/types/kds';

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
            <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_1fr]">
                <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#14532d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div
                        className="absolute -right-20 -top-24 size-80 rounded-full bg-white/5"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5"
                        aria-hidden="true"
                    />

                    <div className="relative flex items-center gap-3">
                        <img
                            src="/images/menanti-logo.png"
                            alt="Menanti Pagi"
                            className="size-14 rounded-full object-cover"
                        />
                        <div className="leading-none">
                            <p className="text-2xl font-bold">Menanti Pagi</p>
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-white/60">
                                Coffee &amp; Eatery
                            </p>
                        </div>
                    </div>

                    <div className="relative max-w-[440px]">
                        <h2 className="text-[42px] font-bold leading-[1.08]">
                            Dari pesanan masuk
                            <br />
                            ke cangkir.
                        </h2>
                        <p className="mt-4 text-[13.5px] leading-relaxed text-white/65">
                            Papan dapur menampilkan setiap pesanan yang sudah dibayar, lengkap dengan
                            catatan pelanggan. Tandai progres agar pelanggan tahu pesanannya sedang
                            disiapkan.
                        </p>

                        <ul className="mt-8 space-y-3 text-[13px] text-white/80">
                            {[
                                'Antrean otomatis diperbarui setiap 10 detik',
                                'Pisahkan pesanan baru, disiapkan, siap, dan diantar',
                                'Catatan dan add-on tampil jelas untuk barista',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2.5">
                                    <MonitorCheck className="mt-0.5 size-4 shrink-0 text-white/50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-[11px] text-white/40">
                        Akses khusus staf Menanti. Semua perubahan status tercatat.
                    </p>
                </aside>

                <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                    <div className="w-full max-w-[380px]">
                        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                            <img
                                src="/images/menanti-logo.png"
                                alt="Menanti Pagi"
                                className="size-10 rounded-full object-cover"
                            />
                            <div className="leading-none">
                                <p className="text-xl font-bold text-ink">Menanti Pagi</p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                                    Staff Access
                                </p>
                            </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand">
                            <LockKeyhole className="size-3" />
                            Area staf
                        </span>
                        <h1 className="mt-3 text-[30px] font-semibold leading-tight text-ink">
                            Masuk ke papan dapur
                        </h1>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                            Gunakan akun barista atau admin yang diberikan pemilik toko.
                        </p>

                        <form onSubmit={submit} className="mt-7 space-y-4">
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

                            <Button type="submit" size="lg" fullWidth loading={processing}>
                                <Mail className="size-4" />
                                Masuk
                            </Button>
                        </form>

                        {demo && (
                            <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-3.5">
                                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                                    Akun demo lokal
                                </p>
                                <div className="mt-2 grid gap-1.5">
                                    {[
                                        { label: 'Barista', email: demo.barista },
                                        { label: 'Admin', email: demo.admin },
                                    ].map((account) => (
                                        <button
                                            key={account.label}
                                            type="button"
                                            onClick={() =>
                                                setData({ email: account.email, password: demo.password })
                                            }
                                            className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-left text-[11.5px] transition-colors hover:bg-brand-soft"
                                        >
                                            <span className="font-semibold text-ink">{account.label}</span>
                                            <span className="text-ink-muted">{account.email}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-[10.5px] text-ink-muted">
                                    Password: <span className="font-semibold text-ink">{demo.password}</span>
                                </p>
                            </div>
                        )}

                        <p className="mt-6 text-center text-[11px] text-ink-muted">
                            Pelanggan?{' '}
                            <a href="/" className="font-semibold text-brand underline-offset-2 hover:underline">
                                Kembali ke menu
                            </a>
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
