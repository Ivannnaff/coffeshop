import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    ChevronRight,
    LocateFixed,
    Lock,
    MapPin,
    ReceiptText,
    ShoppingBag,
} from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { ModeBar } from '@/Components/ui/ModeBar';
import { EmptyState } from '@/Components/ui/EmptyState';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { useCart } from '@/Context/CartContext';
import { useToast } from '@/Context/ToastContext';
import { createOrder, fetchCheckoutPreview } from '@/lib/api/endpoints';
import { firstError, toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import { cn } from '@/lib/cn';
import type { CheckoutPageProps, CheckoutPreview } from '@/types';

interface Coordinates {
    latitude: number;
    longitude: number;
}

export default function CheckoutIndex({ cart: initialCart, store, table }: CheckoutPageProps) {
    const { cart, syncCart, changeMode, reset, pending } = useCart();
    const toast = useToast();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [locating, setLocating] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const [previewState, setPreviewState] = useState<{
        key: string;
        data: CheckoutPreview | null;
        error: string | null;
    } | null>(null);

    useEffect(() => {
        syncCart(initialCart);
    }, [initialCart, syncCart]);

    const coordsKey = coords ? `${coords.latitude},${coords.longitude}` : null;
    const previewActive = cart.mode === 'delivery' && coordsKey !== null;
    const previewIsCurrent = previewState?.key === coordsKey;
    const preview = previewActive && previewIsCurrent ? previewState.data : null;
    const previewError = previewActive && previewIsCurrent ? previewState.error : null;
    const previewLoading = previewActive && !previewIsCurrent;

    useEffect(() => {
        const latitude = coords?.latitude;
        const longitude = coords?.longitude;

        if (cart.mode !== 'delivery' || latitude === undefined || longitude === undefined) {
            return;
        }

        const key = `${latitude},${longitude}`;
        let cancelled = false;

        fetchCheckoutPreview({ mode: 'delivery', latitude, longitude })
            .then((result) => {
                if (!cancelled) setPreviewState({ key, data: result, error: null });
            })
            .catch((error) => {
                if (!cancelled) {
                    setPreviewState({ key, data: null, error: toApiError(error).message });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [cart.mode, coords]);

    const total = useMemo(() => {
        if (cart.mode === 'delivery') return preview?.total ?? cart.subtotal;

        return cart.subtotal;
    }, [cart.mode, preview, cart.subtotal]);

    const locked = cart.mode === 'dine_in';
    const modeLabel =
        cart.mode === 'dine_in' ? 'Makan di tempat' : cart.mode === 'delivery' ? 'Diantar' : 'Bawa pulang';

    const locate = () => {
        if (!('geolocation' in navigator)) {
            toast.push('Perangkat ini tidak mendukung lokasi otomatis.', 'error');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocating(false);
            },
            () => {
                setLocating(false);
                toast.push('Gagal membaca lokasi. Izinkan akses lokasi lalu coba lagi.', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const handleSubmit = async () => {
        if (submitting) return;

        setErrors({});
        setSubmitting(true);

        try {
            const order = await createOrder({
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                mode: cart.mode,
                pickup_note: note.trim() === '' ? null : note.trim(),
                ...(cart.mode === 'delivery' && coords
                    ? {
                          delivery: {
                              address: address.trim(),
                              latitude: coords.latitude,
                              longitude: coords.longitude,
                          },
                      }
                    : {}),
            });

            rememberOrder(order.public_token);
            reset();
            router.visit(`/pembayaran/${order.public_token}`);
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.code === 'PAYMENT_INITIATION_FAILED' && apiError.order) {
                rememberOrder(apiError.order.public_token);
                toast.push('Pesanan tersimpan. Selesaikan pembayaran.', 'info');
                reset();
                router.visit(`/pembayaran/${apiError.order.public_token}`);
                return;
            }

            setErrors(apiError.errors ?? {});
            toast.push(apiError.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (cart.items.length === 0) {
        return (
            <AppShell nav={false}>
                <PageHeader />
                <EmptyState
                    icon={<ShoppingBag className="size-7" />}
                    title="Keranjang masih kosong"
                    description="Tambahkan menu favoritmu sebelum melanjutkan ke pembayaran."
                    action={
                        <Link href="/">
                            <Button>Pilih menu</Button>
                        </Link>
                    }
                />
            </AppShell>
        );
    }

    const formInvalid =
        name.trim() === '' ||
        phone.trim() === '' ||
        (cart.mode === 'delivery' && (address.trim() === '' || coords === null));

    return (
        <AppShell nav={false}>
            <PageHeader />

            <div className="flex flex-col gap-4 px-4 pb-36 md:px-6 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8 lg:pb-16 lg:pt-2">
                <section className="order-1 rounded-2xl border border-line/60 bg-surface p-4 lg:order-2 lg:sticky lg:top-24">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                            <ReceiptText className="size-4 text-brand" />
                            Ringkasan pesanan
                        </h2>
                        <span className="text-[11.5px] text-ink-muted">{cart.items.length} menu</span>
                    </div>

                    <ul className="mt-3 space-y-2.5">
                        {cart.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3">
                                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-canvas-deep">
                                    <CoffeeArt seed={item.product_name} compact />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-ink">
                                        {item.product_name}
                                    </p>
                                    <p className="text-[11.5px] text-ink-muted">
                                        {[item.size_name, item.temperature_name].filter(Boolean).join(' · ') ||
                                            'Regular'}
                                        {' · '}
                                        {item.qty}x
                                    </p>
                                </div>
                                <span className="text-[13px] font-semibold tabular text-ink">
                                    {formatRupiah(item.line_total)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3 text-[13px]">
                        <SummaryRow label="Subtotal" value={formatRupiah(cart.subtotal)} />
                        {cart.mode === 'delivery' && (
                            <>
                                <SummaryRow
                                    label="Biaya antar"
                                    value={
                                        previewLoading
                                            ? 'Menghitung...'
                                            : preview
                                              ? formatRupiah(preview.delivery_fee)
                                              : '-'
                                    }
                                />
                                {preview && preview.delivery_discount > 0 && (
                                    <SummaryRow
                                        label="Diskon antar"
                                        value={`-${formatRupiah(preview.delivery_discount)}`}
                                        accent
                                    />
                                )}
                            </>
                        )}
                        <div className="flex items-center justify-between pt-1">
                            <span className="font-semibold text-ink">Total</span>
                            <span className="text-lg font-bold tabular text-brand">
                                {formatRupiah(total)}
                            </span>
                        </div>
                    </div>

                    {cart.mode === 'delivery' && preview && (
                        <div className="mt-3 rounded-xl bg-brand-mist px-3 py-2.5 text-[11.5px] text-brand">
                            <p className="flex items-center gap-1.5 font-semibold">
                                <BadgeCheck className="size-3.5" />
                                {preview.zone_name ?? 'Zona pengiriman'}
                                {preview.distance_km !== null && ` · ${preview.distance_km.toFixed(1)} km`}
                            </p>
                            <p className="mt-0.5 text-brand/80">
                                Pesanan akan diantar ke lokasi yang kamu pilih.
                            </p>
                        </div>
                    )}

                    {previewError && (
                        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2.5 text-[11.5px] font-medium text-danger">
                            {previewError}
                        </p>
                    )}

                    <div className="mt-4 hidden border-t border-line/70 pt-4 lg:block">
                        <Button
                            size="lg"
                            fullWidth
                            loading={submitting}
                            disabled={formInvalid || pending || previewLoading}
                            onClick={handleSubmit}
                        >
                            {cart.mode === 'delivery' && !coords
                                ? 'Atur lokasi pengiriman'
                                : 'Buat pesanan'}
                        </Button>
                        <p className="mt-2 text-center text-[10.5px] leading-relaxed text-ink-muted">
                            Data hanya dipakai untuk memproses pesanan ini.
                        </p>
                    </div>
                </section>

                <div className="order-2 space-y-4 lg:order-1">
                <section className="rounded-2xl border border-line/60 bg-surface p-4">
                    <h2 className="text-[15px] font-semibold text-ink">Cara menikmati</h2>
                    <div className="mt-3">
                        <ModeBar mode={cart.mode} onChange={changeMode} locked={locked} />
                    </div>
                    {locked && table && (
                        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                            <Lock className="size-3.5" />
                            Mode makan di tempat terkunci untuk Meja {table.number}.
                        </p>
                    )}
                    {cart.mode === 'takeaway' && store.address && (
                        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-ink-muted">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            Ambil pesanan di {store.name}, {store.address}.
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-line/60 bg-surface p-4">
                    <h2 className="text-[15px] font-semibold text-ink">Data pemesan</h2>
                    <p className="mb-3 mt-0.5 text-[11.5px] text-ink-muted">
                        Nomor WhatsApp dipakai untuk konfirmasi pesanan.
                    </p>

                    <div className="space-y-3">
                        <Input
                            label="Nama"
                            placeholder="Nama kamu"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            error={firstError(errors, 'customer_name')}
                        />
                        <Input
                            label="Nomor WhatsApp"
                            type="tel"
                            inputMode="numeric"
                            placeholder="08xxxxxxxxxx"
                            autoComplete="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, ''))}
                            hint="Diawali 08, 10-15 digit."
                            error={firstError(errors, 'customer_phone')}
                        />

                        {cart.mode === 'delivery' && (
                            <>
                                <Textarea
                                    label="Alamat pengiriman"
                                    rows={3}
                                    placeholder="Nama jalan, nomor rumah, patokan"
                                    value={address}
                                    onChange={(event) => setAddress(event.target.value)}
                                    error={firstError(errors, 'delivery.address')}
                                />

                                <div
                                    className={cn(
                                        'rounded-xl border p-3',
                                        coords ? 'border-brand/30 bg-brand-mist' : 'border-dashed border-line bg-canvas',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[12.5px] font-semibold text-ink">
                                                Titik lokasi pengiriman
                                            </p>
                                            <p className="mt-0.5 text-[11.5px] text-ink-muted">
                                                {coords
                                                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                                                    : 'Dibutuhkan untuk menghitung jarak dan ongkir.'}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={coords ? 'secondary' : 'primary'}
                                            loading={locating}
                                            onClick={locate}
                                        >
                                            <LocateFixed className="size-3.5" />
                                            {coords ? 'Perbarui' : 'Lokasi saya'}
                                        </Button>
                                    </div>
                                    {firstError(errors, 'delivery.latitude') && (
                                        <p className="mt-2 text-xs font-medium text-danger">
                                            Lokasi pengiriman wajib diisi.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <Textarea
                            label="Catatan pesanan (opsional)"
                            rows={2}
                            maxLength={140}
                            placeholder={
                                cart.mode === 'delivery'
                                    ? 'Contoh: titip ke resepsionis'
                                    : 'Contoh: tanpa sedotan, gula terpisah'
                            }
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            error={firstError(errors, 'pickup_note')}
                        />
                    </div>
                </section>

                <p className="flex items-center justify-center gap-1.5 px-4 text-center text-[11px] text-ink-muted lg:hidden">
                    <Lock className="size-3" />
                    Data kamu hanya dipakai untuk memproses pesanan ini.
                </p>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/95 backdrop-blur-md lg:hidden">
                <div className="mx-auto w-full max-w-[520px] px-4 pb-safe pt-3">
                    <div className="mb-2 flex items-center justify-between text-[12.5px] text-ink-muted">
                        <span className="flex items-center gap-1.5">
                            {modeLabel}
                            <ChevronRight className="size-3" />
                            {cart.items.length} item
                        </span>
                        <span className="text-base font-bold tabular text-ink">{formatRupiah(total)}</span>
                    </div>
                    <Button
                        size="lg"
                        fullWidth
                        loading={submitting}
                        disabled={formInvalid || pending || previewLoading}
                        onClick={handleSubmit}
                    >
                        {cart.mode === 'delivery' && !coords ? 'Atur lokasi pengiriman' : 'Buat pesanan'}
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}

function rememberOrder(token: string) {
    try {
        localStorage.setItem('menanti.last-order', token);
    } catch {
        // localStorage bisa diblokir; token tetap tersedia di URL pembayaran.
    }
}

function PageHeader() {
    return (
        <header className="flex items-center gap-3 px-4 pb-4 pt-5 md:px-6 lg:mx-auto lg:max-w-6xl lg:pb-6 lg:pt-8">
            <Link
                href="/"
                aria-label="Kembali ke menu"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink"
            >
                <ArrowLeft className="size-5" />
            </Link>
            <div>
                <h1 className="text-xl font-semibold text-ink">Checkout</h1>
                <p className="text-[11.5px] text-ink-muted">Langkah 1 dari 2 · Detail pesanan</p>
            </div>
        </header>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-ink-muted">{label}</span>
            <span className={cn('font-medium tabular', accent ? 'text-success' : 'text-ink')}>{value}</span>
        </div>
    );
}
