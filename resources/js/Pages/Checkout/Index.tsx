import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    ChevronRight,
    LocateFixed,
    Lock,
    MapPin,
    ReceiptText,
    ShoppingBag,
} from 'lucide-react';
import { AppShell } from '@/Components/layouts/AppShell';
import { PublicPageHeader } from '@/Components/layouts/PublicPageHeader';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { ModeBar } from '@/Components/ui/ModeBar';
import { EmptyState } from '@/Components/ui/EmptyState';
import { ProductThumb } from '@/Components/ui/ProductThumb';
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
        cart.mode === 'dine_in'
            ? 'Makan di tempat'
            : cart.mode === 'delivery'
              ? 'Diantar'
              : 'Bawa pulang';

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
                <PublicPageHeader title="Checkout" meta="Langkah 1 dari 2 · Detail pesanan" />
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
            <PublicPageHeader title="Checkout" meta="Langkah 1 dari 2 · Detail pesanan" />

            <div className="flex flex-col gap-4 px-4 pb-36 md:px-6 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8 lg:pt-2 lg:pb-16">
                <section className="rule order-1 pt-5 lg:sticky lg:top-24 lg:order-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                            <ReceiptText className="text-brand size-4" />
                            Ringkasan pesanan
                        </h2>
                        <span className="text-ink-muted text-[13px]">{cart.items.length} menu</span>
                    </div>

                    <ul className="mt-3 space-y-2.5">
                        {cart.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3">
                                <ProductThumb name={item.product_name} size={48} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink truncate text-[13px] font-semibold">
                                        {item.product_name}
                                    </p>
                                    <p className="text-ink-muted text-[13px]">
                                        {[item.size_name, item.temperature_name]
                                            .filter(Boolean)
                                            .join(' · ') || 'Regular'}
                                        {' · '}
                                        {item.qty}x
                                    </p>
                                </div>
                                <span className="tabular text-ink text-[13px] font-semibold">
                                    {formatRupiah(item.line_total)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="border-line/70 mt-3 space-y-1.5 border-t pt-3 text-[13px]">
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
                            <span className="text-ink font-semibold">Total</span>
                            <span className="tabular text-brand text-lg font-bold">
                                {formatRupiah(total)}
                            </span>
                        </div>
                    </div>

                    {cart.mode === 'delivery' && preview && (
                        <div className="bg-brand-mist text-brand mt-3 rounded-xl px-3 py-2.5 text-[13px]">
                            <p className="flex items-center gap-1.5 font-semibold">
                                <BadgeCheck className="size-3.5" />
                                {preview.zone_name ?? 'Zona pengiriman'}
                                {preview.distance_km !== null &&
                                    ` · ${preview.distance_km.toFixed(1)} km`}
                            </p>
                            <p className="text-brand/80 mt-0.5">
                                Pesanan akan diantar ke lokasi yang kamu pilih.
                            </p>
                        </div>
                    )}

                    {previewError && (
                        <p className="bg-danger-soft text-danger mt-3 rounded-xl px-3 py-2.5 text-[13px] font-medium">
                            {previewError}
                        </p>
                    )}

                    <div className="border-line/70 mt-4 hidden border-t pt-4 lg:block">
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
                        <p className="text-ink-muted mt-2 text-center text-[12px] leading-relaxed">
                            Data hanya dipakai untuk memproses pesanan ini.
                        </p>
                    </div>
                </section>

                <div className="order-2 space-y-4 lg:order-1">
                    <section className="rule pt-5">
                        <h2 className="text-ink text-[15px] font-semibold">Cara menikmati</h2>
                        <div className="mt-3">
                            <ModeBar mode={cart.mode} onChange={changeMode} locked={locked} />
                        </div>
                        {locked && table && (
                            <p className="text-ink-muted mt-2 flex items-center gap-1.5 text-[13px]">
                                <Lock className="size-3.5" />
                                Mode makan di tempat terkunci untuk Meja {table.number}.
                            </p>
                        )}
                        {cart.mode === 'takeaway' && store.address && (
                            <p className="text-ink-muted mt-2 flex items-start gap-1.5 text-[13px]">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                Ambil pesanan di {store.name}, {store.address}.
                            </p>
                        )}
                    </section>

                    <section className="rule pt-5">
                        <h2 className="text-ink text-[15px] font-semibold">Data pemesan</h2>
                        <p className="text-ink-muted mt-0.5 mb-3 text-[13px]">
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
                                onChange={(event) =>
                                    setPhone(event.target.value.replace(/[^\d]/g, ''))
                                }
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
                                            coords
                                                ? 'border-brand/30 bg-brand-mist'
                                                : 'border-line bg-canvas border-dashed',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-ink text-[12.5px] font-semibold">
                                                    Titik lokasi pengiriman
                                                </p>
                                                <p className="text-ink-muted mt-0.5 text-[13px]">
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
                                            <p className="text-danger mt-2 text-xs font-medium">
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

                    <p className="text-ink-muted flex items-center justify-center gap-1.5 px-4 text-center text-[11px] lg:hidden">
                        <Lock className="size-3" />
                        Data kamu hanya dipakai untuk memproses pesanan ini.
                    </p>
                </div>
            </div>

            <div className="slip fixed inset-x-0 bottom-0 z-40 lg:hidden">
                <div className="pb-safe mx-auto w-full max-w-[520px] px-4 pt-3">
                    <div className="text-surface/60 mb-2 flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-1.5">
                            {modeLabel}
                            <ChevronRight className="size-3" />
                            {cart.items.length} item
                        </span>
                        <span className="tabular text-surface text-base font-bold">
                            {formatRupiah(total)}
                        </span>
                    </div>
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

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-ink-muted">{label}</span>
            <span className={cn('tabular font-medium', accent ? 'text-success' : 'text-ink')}>
                {value}
            </span>
        </div>
    );
}
