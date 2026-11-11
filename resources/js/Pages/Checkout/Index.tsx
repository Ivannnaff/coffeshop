import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { PublicLayout } from '@/Layouts/PublicLayout';
import { Cart, CheckoutPreview } from '@/lib/api/types';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors/messages';
import { validatePhone, toLocalPhone } from '@/lib/validation/phone';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TextField, TextArea } from '@/Components/ui/TextField';
import { Button } from '@/Components/ui/Button';
import { MapPicker, Coords } from '@/Components/checkout/MapPicker';
import { CheckoutSummary } from '@/Components/checkout/CheckoutSummary';

interface CheckoutProps {
    cart: Cart;
    store: { name: string; address: string | null; latitude: string | null; longitude: string | null } | null;
    table: { number: string } | null;
}

type FieldErrors = Record<string, string | undefined>;

export default function CheckoutIndex({ cart, store, table }: CheckoutProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [coords, setCoords] = useState<Coords | null>(null);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [preview, setPreview] = useState<CheckoutPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isDelivery = cart.mode === 'delivery';
    const debouncedCoords = useDebouncedValue(coords, 500);

    const storeCenter = useMemo<Coords | null>(() => {
        if (!store?.latitude || !store?.longitude) return null;
        return { lat: Number(store.latitude), lng: Number(store.longitude) };
    }, [store?.latitude, store?.longitude]);

    useEffect(() => {
        if (!isDelivery || !debouncedCoords) {
            setPreview(null);
            return;
        }

        let cancelled = false;
        setPreviewLoading(true);
        setPreviewError(null);

        api.previewCheckout({
            mode: 'delivery',
            latitude: debouncedCoords.lat,
            longitude: debouncedCoords.lng,
        })
            .then((data) => {
                if (!cancelled) setPreview(data);
            })
            .catch((caught) => {
                if (cancelled) return;
                setPreview(null);
                setPreviewError(
                    caught instanceof ApiError
                        ? getErrorMessage(caught.code)
                        : 'Ongkir gagal dihitung. Coba lagi.',
                );
            })
            .finally(() => {
                if (!cancelled) setPreviewLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isDelivery, debouncedCoords?.lat, debouncedCoords?.lng]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const nextErrors: FieldErrors = {};
        if (name.trim() === '') nextErrors.name = 'Nama lengkap wajib diisi.';
        else if (name.trim().length > 100) nextErrors.name = 'Nama maksimal 100 karakter.';

        const phoneError = validatePhone(phone);
        if (phoneError) nextErrors.phone = phoneError;

        if (isDelivery) {
            if (address.trim() === '') nextErrors.address = 'Alamat lengkap wajib diisi.';
            else if (address.trim().length > 255) nextErrors.address = 'Alamat maksimal 255 karakter.';
            if (!coords) nextErrors.coords = 'Tentukan titik lokasi pengiriman di peta.';
            if (previewError) nextErrors.coords = previewError;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setSubmitError(null);
        setSubmitting(true);

        try {
            const order = await api.checkout({
                customer_name: name.trim(),
                customer_phone: toLocalPhone(phone),
                mode: cart.mode,
                pickup_note: note.trim() !== '' ? note.trim() : null,
                delivery: isDelivery && coords
                    ? { address: address.trim(), latitude: coords.lat, longitude: coords.lng }
                    : null,
            });

            router.visit(`/pembayaran/${order.public_token}`);
        } catch (caught) {
            if (caught instanceof ApiError) {
                const details = caught.details as { public_token?: string } | undefined;
                if (caught.status === 502 && details?.public_token) {
                    router.visit(`/pembayaran/${details.public_token}`);
                    return;
                }

                if (caught.code === 'VALIDATION_FAILED' && caught.errors) {
                    const mapped: FieldErrors = {};
                    for (const [key, messages] of Object.entries(caught.errors)) {
                        if (key.startsWith('delivery.')) {
                            const field = key.split('.')[1];
                            mapped[field === 'address' ? 'address' : 'coords'] = messages[0];
                        } else if (key === 'customer_name') {
                            mapped.name = messages[0];
                        } else if (key === 'customer_phone') {
                            mapped.phone = messages[0];
                        }
                    }
                    setErrors(mapped);
                    return;
                }

                setSubmitError(getErrorMessage(caught.code));
            } else {
                setSubmitError('Terjadi kesalahan. Coba lagi.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const canPay = !cart.has_unavailable_items && cart.items.length > 0 && !(isDelivery && previewError);

    return (
        <PublicLayout cart={cart} table={table}>
            <Head title="Checkout" />
            <div className="mx-auto max-w-5xl px-4 py-6">
                <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Checkout</h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="flex flex-col gap-5 lg:col-span-7">
                        <TextField
                            label="Nama lengkap"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            error={errors.name}
                            maxLength={100}
                            autoComplete="name"
                            required
                        />
                        <TextField
                            label="Nomor WhatsApp"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            error={errors.phone}
                            hint="Contoh: 081234567890"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                        />

                        {isDelivery && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-medium text-ink">Titik lokasi pengiriman</span>
                                    <MapPicker value={coords} onChange={setCoords} center={storeCenter} />
                                    {errors.coords && <p className="text-[13px] text-danger">{errors.coords}</p>}
                                </div>
                                <TextArea
                                    label="Alamat lengkap"
                                    value={address}
                                    onChange={(event) => setAddress(event.target.value)}
                                    error={errors.address}
                                    hint="Contoh: pagar hitam, sebelah warung"
                                    maxLength={255}
                                    required
                                />
                            </>
                        )}

                        <TextField
                            label="Catatan pengambilan (opsional)"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            maxLength={140}
                            hint="Maksimal 140 karakter"
                        />

                        {cart.has_unavailable_items && (
                            <p className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
                                Ada item yang tidak tersedia di keranjang. Kembali ke keranjang untuk menghapusnya.
                            </p>
                        )}

                        {submitError && (
                            <p className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
                                {submitError}
                            </p>
                        )}

                        <Button type="submit" loading={submitting} disabled={!canPay} className="w-full">
                            Bayar sekarang
                        </Button>
                    </div>

                    <div className="lg:col-span-5">
                        <CheckoutSummary
                            mode={cart.mode}
                            subtotal={cart.subtotal}
                            minItemPrice={cart.min_item_price}
                            preview={preview}
                            loading={previewLoading}
                            error={previewError}
                        />
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}
