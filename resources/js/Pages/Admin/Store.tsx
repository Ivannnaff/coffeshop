import { useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Clock3, Loader2, MapPin, Save, Store } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { useToast } from '@/Context/ToastContext';
import { getStoreSettings, updateStoreSettings } from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import type { AdminPageProps, StoreSettings } from '@/types/admin';

interface StoreForm {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    opening_time: string;
    closing_time: string;
    timezone: string;
    is_accepting_orders: boolean;
    payment_expiry_minutes: number;
    delivery_min_item_price: number;
}

const emptyForm = (): StoreForm => ({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    opening_time: '',
    closing_time: '',
    timezone: 'Asia/Jakarta',
    is_accepting_orders: true,
    payment_expiry_minutes: 15,
    delivery_min_item_price: 15000,
});

export default function AdminStore({ staff }: AdminPageProps) {
    const toast = useToast();

    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [form, setForm] = useState<StoreForm>(emptyForm());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await getStoreSettings();
            setSettings(data);
            setForm({
                name: data.name,
                address: data.address ?? '',
                latitude: data.latitude === null ? '' : `${data.latitude}`,
                longitude: data.longitude === null ? '' : `${data.longitude}`,
                opening_time: data.opening_time?.slice(0, 5) ?? '',
                closing_time: data.closing_time?.slice(0, 5) ?? '',
                timezone: data.timezone,
                is_accepting_orders: data.is_accepting_orders,
                payment_expiry_minutes: data.payment_expiry_minutes,
                delivery_min_item_price: data.delivery_min_item_price,
            });
            setError(null);
        } catch (requestError) {
            setError(toApiError(requestError).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [load]);

    const handleSave = async () => {
        if (form.name.trim() === '') {
            toast.push('Nama toko wajib diisi.', 'error');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                address: form.address.trim() === '' ? null : form.address.trim(),
                latitude: form.latitude === '' ? null : Number(form.latitude),
                longitude: form.longitude === '' ? null : Number(form.longitude),
                opening_time: form.opening_time === '' ? null : `${form.opening_time}:00`,
                closing_time: form.closing_time === '' ? null : `${form.closing_time}:00`,
                timezone: form.timezone.trim(),
                is_accepting_orders: form.is_accepting_orders,
                payment_expiry_minutes: Number(form.payment_expiry_minutes),
                delivery_min_item_price: Number(form.delivery_min_item_price),
            };

            const updated = await updateStoreSettings(payload);
            setSettings(updated);
            toast.push('Pengaturan toko disimpan');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Toko" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">Pengaturan</p>
                    <h1 className="mt-1 text-2xl font-semibold text-ink md:text-[30px]">Toko</h1>
                    <p className="mt-1 text-[12px] text-ink-muted">
                        Identitas, lokasi, jam buka, dan batas pembayaran.
                    </p>
                </div>
                <Button loading={saving} onClick={handleSave}>
                    <Save className="size-4" />
                    Simpan
                </Button>
            </div>

            {error && (
                <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12px] font-medium text-danger">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-muted">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat pengaturan...
                </div>
            ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                    <div className="space-y-4">
                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <div className="flex items-center gap-2">
                                <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
                                    <Store className="size-4" />
                                </span>
                                <h2 className="text-[15px] font-semibold text-ink">Identitas toko</h2>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <Input
                                    label="Nama toko"
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                />
                                <Input
                                    label="Zona waktu"
                                    hint="Contoh: Asia/Jakarta"
                                    value={form.timezone}
                                    onChange={(event) =>
                                        setForm({ ...form, timezone: event.target.value })
                                    }
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Alamat"
                                        value={form.address}
                                        onChange={(event) =>
                                            setForm({ ...form, address: event.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <div className="flex items-center gap-2">
                                <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
                                    <MapPin className="size-4" />
                                </span>
                                <h2 className="text-[15px] font-semibold text-ink">Lokasi</h2>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <Input
                                    label="Latitude"
                                    value={form.latitude}
                                    onChange={(event) =>
                                        setForm({ ...form, latitude: event.target.value })
                                    }
                                    hint="Dipakai untuk menghitung ongkir."
                                />
                                <Input
                                    label="Longitude"
                                    value={form.longitude}
                                    onChange={(event) =>
                                        setForm({ ...form, longitude: event.target.value })
                                    }
                                />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <div className="flex items-center gap-2">
                                <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
                                    <Clock3 className="size-4" />
                                </span>
                                <h2 className="text-[15px] font-semibold text-ink">Jam operasional</h2>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="block text-[13px] font-semibold text-ink">
                                        Jam buka
                                    </span>
                                    <input
                                        type="time"
                                        value={form.opening_time}
                                        onChange={(event) =>
                                            setForm({ ...form, opening_time: event.target.value })
                                        }
                                        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="block text-[13px] font-semibold text-ink">
                                        Jam tutup
                                    </span>
                                    <input
                                        type="time"
                                        value={form.closing_time}
                                        onChange={(event) =>
                                            setForm({ ...form, closing_time: event.target.value })
                                        }
                                        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-line/70 bg-surface p-4">
                            <h2 className="text-[15px] font-semibold text-ink">Pembayaran & pengantaran</h2>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <Input
                                    label="Batas waktu pembayaran (menit)"
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={form.payment_expiry_minutes}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            payment_expiry_minutes: Number(event.target.value),
                                        })
                                    }
                                />
                                <Input
                                    label="Minimal belanja antar (Rp)"
                                    type="number"
                                    min={0}
                                    value={form.delivery_min_item_price}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            delivery_min_item_price: Number(event.target.value),
                                        })
                                    }
                                />
                            </div>
                            <label className="mt-3 flex items-center gap-2 text-[12.5px] font-medium text-ink">
                                <input
                                    type="checkbox"
                                    checked={form.is_accepting_orders}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            is_accepting_orders: event.target.checked,
                                        })
                                    }
                                    className="size-4 accent-[#1E5B3E]"
                                />
                                Menerima pesanan saat ini
                            </label>
                        </section>
                    </div>

                    <aside className="space-y-3 lg:sticky lg:top-6">
                        <div className="rounded-2xl border border-line/70 bg-surface p-4">
                            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                                Status toko
                            </p>
                            <p
                                className={
                                    form.is_accepting_orders
                                        ? 'mt-1 text-[15px] font-semibold text-success'
                                        : 'mt-1 text-[15px] font-semibold text-danger'
                                }
                            >
                                {form.is_accepting_orders ? 'Menerima pesanan' : 'Sedang tutup'}
                            </p>
                            <p className="mt-1 text-[11.5px] text-ink-muted">
                                {form.opening_time && form.closing_time
                                    ? `Jam buka ${form.opening_time}–${form.closing_time}`
                                    : 'Jam operasional belum diatur'}
                            </p>
                            {settings && (
                                <p className="mt-3 border-t border-line/60 pt-3 text-[10.5px] text-ink-muted">
                                    Store ID {settings.store_id} · zona {settings.timezone}
                                </p>
                            )}
                        </div>

                        <Button
                            size="lg"
                            fullWidth
                            loading={saving}
                            onClick={handleSave}
                            className="hidden lg:flex"
                        >
                            <Save className="size-4" />
                            Simpan pengaturan
                        </Button>

                        <p className="px-1 text-[10.5px] leading-relaxed text-ink-muted">
                            Perubahan batas pembayaran dan minimal antar berlaku untuk checkout
                            berikutnya.
                        </p>
                    </aside>
                </div>
            )}
        </AdminLayout>
    );
}
