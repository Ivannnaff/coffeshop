import { useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Sheet } from '@/Components/ui/Sheet';
import { useToast } from '@/Context/ToastContext';
import {
    createDeliveryZone,
    createFeeRule,
    deleteDeliveryZone,
    deleteFeeRule,
    getDeliveryZones,
    updateDeliveryZone,
} from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import type { AdminPageProps, DeliveryFeeRule, DeliveryZone } from '@/types/admin';

interface ZoneForm {
    name: string;
    max_distance_km: string;
    base_fee: number;
    free_fee_min_subtotal: number;
    sort_order: number;
    is_active: boolean;
}

interface FeeForm {
    min_eligible_subtotal: number;
    discount_type: 'free' | 'percent';
    discount_value: number;
    is_active: boolean;
}

const emptyZone = (): ZoneForm => ({
    name: '',
    max_distance_km: '3',
    base_fee: 0,
    free_fee_min_subtotal: 0,
    sort_order: 0,
    is_active: true,
});

const emptyFee = (): FeeForm => ({
    min_eligible_subtotal: 0,
    discount_type: 'free',
    discount_value: 0,
    is_active: true,
});

export default function AdminDelivery({ staff }: AdminPageProps) {
    const toast = useToast();

    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
    const [zoneForm, setZoneForm] = useState<ZoneForm>(emptyZone());
    const [zoneSaving, setZoneSaving] = useState(false);

    const [feeZone, setFeeZone] = useState<DeliveryZone | null>(null);
    const [feeForm, setFeeForm] = useState<FeeForm>(emptyFee());
    const [feeSaving, setFeeSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setZones(await getDeliveryZones());
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

    const openCreate = () => {
        setEditingZone(null);
        setZoneForm(emptyZone());
        setZoneSheetOpen(true);
    };

    const openEdit = (zone: DeliveryZone) => {
        setEditingZone(zone);
        setZoneForm({
            name: zone.name,
            max_distance_km: `${zone.max_distance_km}`,
            base_fee: zone.base_fee,
            free_fee_min_subtotal: zone.free_fee_min_subtotal ?? 0,
            sort_order: zone.sort_order,
            is_active: zone.is_active,
        });
        setZoneSheetOpen(true);
    };

    const handleZoneSave = async () => {
        if (zoneForm.name.trim() === '') {
            toast.push('Nama zona wajib diisi.', 'error');
            return;
        }

        setZoneSaving(true);

        try {
            const payload = {
                name: zoneForm.name.trim(),
                max_distance_km: Number(zoneForm.max_distance_km),
                base_fee: Number(zoneForm.base_fee),
                free_fee_min_subtotal: Number(zoneForm.free_fee_min_subtotal),
                sort_order: Number(zoneForm.sort_order),
                is_active: zoneForm.is_active,
            };

            if (editingZone) {
                await updateDeliveryZone(editingZone.id, payload);
            } else {
                await createDeliveryZone(payload);
            }

            await load();
            setZoneSheetOpen(false);
            toast.push(editingZone ? 'Zona diperbarui' : 'Zona dibuat');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setZoneSaving(false);
        }
    };

    const handleZoneDelete = async (zone: DeliveryZone) => {
        if (!window.confirm(`Hapus zona “${zone.name}”? Aturan ongkirnya juga akan terdampak.`)) {
            return;
        }

        try {
            await deleteDeliveryZone(zone.id);
            setZones((current) => current.filter((item) => item.id !== zone.id));
            toast.push('Zona dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    const openFee = (zone: DeliveryZone) => {
        setFeeZone(zone);
        setFeeForm(emptyFee());
    };

    const handleFeeSave = async () => {
        if (!feeZone) return;

        setFeeSaving(true);

        try {
            await createFeeRule(feeZone.id, {
                min_eligible_subtotal: Number(feeForm.min_eligible_subtotal),
                discount_type: feeForm.discount_type,
                discount_value:
                    feeForm.discount_type === 'percent' ? Number(feeForm.discount_value) : null,
                is_active: feeForm.is_active,
            });
            await load();
            setFeeZone(null);
            toast.push('Aturan ongkir ditambahkan');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setFeeSaving(false);
        }
    };

    const handleFeeDelete = async (rule: DeliveryFeeRule) => {
        if (!window.confirm('Hapus aturan ongkir ini?')) return;

        try {
            await deleteFeeRule(rule.id);
            await load();
            toast.push('Aturan ongkir dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Pengantaran" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-brand text-[10.5px] font-bold tracking-[0.18em] uppercase">
                        Layanan
                    </p>
                    <h1 className="text-ink mt-1 text-2xl font-semibold md:text-[30px]">
                        Pengantaran
                    </h1>
                    <p className="text-ink-muted mt-1 text-[12px]">
                        Zona jarak, biaya antar, dan diskon berdasarkan subtotal.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah zona
                </Button>
            </div>

            {error && (
                <p className="bg-danger-soft text-danger mt-4 rounded-xl px-3.5 py-2.5 text-[12px] font-medium">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="text-ink-muted flex items-center justify-center gap-2 py-24 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat zona...
                </div>
            ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {zones.map((zone) => (
                        <section
                            key={zone.id}
                            className="border-line/70 bg-surface rounded-2xl border p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="bg-brand-soft text-brand grid size-10 place-items-center rounded-full">
                                        <Truck className="size-4" />
                                    </span>
                                    <div>
                                        <p className="text-ink text-[14px] font-semibold">
                                            {zone.name}
                                        </p>
                                        <p className="text-ink-muted text-[10.5px]">
                                            Maks {zone.max_distance_km} km · ongkir{' '}
                                            {formatRupiah(zone.base_fee)}
                                            {zone.free_fee_min_subtotal
                                                ? ` · gratis ≥ ${formatRupiah(zone.free_fee_min_subtotal)}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(zone)}
                                        aria-label={`Edit ${zone.name}`}
                                        className="text-ink-muted hover:bg-brand-soft hover:text-brand grid size-8 place-items-center rounded-full"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleZoneDelete(zone)}
                                        aria-label={`Hapus ${zone.name}`}
                                        className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-8 place-items-center rounded-full"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="border-line/60 mt-3 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-ink-muted text-[11px] font-bold tracking-[0.1em] uppercase">
                                        Aturan ongkir
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openFee(zone)}
                                        className="border-line text-ink-muted hover:border-brand/30 hover:text-brand inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold"
                                    >
                                        <Plus className="size-3" />
                                        Tambah
                                    </button>
                                </div>

                                <div className="mt-2 space-y-1.5">
                                    {zone.fee_rules.length === 0 && (
                                        <p className="border-line text-ink-muted rounded-lg border border-dashed px-3 py-3 text-[11px]">
                                            Belum ada aturan tambahan.
                                        </p>
                                    )}
                                    {zone.fee_rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className="bg-canvas flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px]"
                                        >
                                            <span className="text-ink-muted">
                                                Subtotal ≥{' '}
                                                {formatRupiah(rule.min_eligible_subtotal)}
                                            </span>
                                            <span className="text-brand font-semibold">
                                                {rule.discount_type === 'free'
                                                    ? 'Gratis ongkir'
                                                    : `Diskon ${rule.discount_value}%`}
                                            </span>
                                            {!rule.is_active && (
                                                <span className="text-ink-muted text-[10px]">
                                                    nonaktif
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleFeeDelete(rule)}
                                                aria-label="Hapus aturan"
                                                className="text-ink-muted hover:bg-danger-soft hover:text-danger ml-auto grid size-6 place-items-center rounded-full"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}

                    {zones.length === 0 && (
                        <p className="border-line text-ink-muted rounded-2xl border border-dashed px-4 py-16 text-center text-[12px] lg:col-span-2">
                            Belum ada zona pengantaran.
                        </p>
                    )}
                </div>
            )}

            <Sheet
                open={zoneSheetOpen}
                onClose={() => setZoneSheetOpen(false)}
                title={editingZone ? 'Edit zona' : 'Zona baru'}
                footer={
                    <div className="flex items-center gap-2 pb-1">
                        <Button variant="outline" onClick={() => setZoneSheetOpen(false)}>
                            Tutup
                        </Button>
                        <Button fullWidth loading={zoneSaving} onClick={handleZoneSave}>
                            Simpan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3 pb-2">
                    <Input
                        label="Nama zona"
                        value={zoneForm.name}
                        onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Jarak maksimum (km)"
                            type="number"
                            step="0.1"
                            value={zoneForm.max_distance_km}
                            onChange={(event) =>
                                setZoneForm({ ...zoneForm, max_distance_km: event.target.value })
                            }
                        />
                        <Input
                            label="Biaya antar (Rp)"
                            type="number"
                            min={0}
                            value={zoneForm.base_fee}
                            onChange={(event) =>
                                setZoneForm({ ...zoneForm, base_fee: Number(event.target.value) })
                            }
                        />
                        <Input
                            label="Gratis ongkir mulai (Rp)"
                            type="number"
                            min={0}
                            value={zoneForm.free_fee_min_subtotal}
                            onChange={(event) =>
                                setZoneForm({
                                    ...zoneForm,
                                    free_fee_min_subtotal: Number(event.target.value),
                                })
                            }
                        />
                        <Input
                            label="Urutan"
                            type="number"
                            min={0}
                            value={zoneForm.sort_order}
                            onChange={(event) =>
                                setZoneForm({ ...zoneForm, sort_order: Number(event.target.value) })
                            }
                        />
                    </div>
                    <label className="text-ink flex items-center gap-2 text-[12.5px] font-medium">
                        <input
                            type="checkbox"
                            checked={zoneForm.is_active}
                            onChange={(event) =>
                                setZoneForm({ ...zoneForm, is_active: event.target.checked })
                            }
                            className="size-4 accent-brand"
                        />
                        Aktif
                    </label>
                </div>
            </Sheet>

            <Sheet
                open={feeZone !== null}
                onClose={() => setFeeZone(null)}
                title={`Aturan ongkir · ${feeZone?.name ?? ''}`}
                footer={
                    <div className="flex items-center gap-2 pb-1">
                        <Button variant="outline" onClick={() => setFeeZone(null)}>
                            Tutup
                        </Button>
                        <Button fullWidth loading={feeSaving} onClick={handleFeeSave}>
                            Simpan aturan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3 pb-2">
                    <Input
                        label="Minimal subtotal (Rp)"
                        type="number"
                        min={0}
                        value={feeForm.min_eligible_subtotal}
                        onChange={(event) =>
                            setFeeForm({
                                ...feeForm,
                                min_eligible_subtotal: Number(event.target.value),
                            })
                        }
                    />
                    <label className="block space-y-1.5">
                        <span className="text-ink block text-[13px] font-semibold">
                            Jenis diskon
                        </span>
                        <select
                            value={feeForm.discount_type}
                            onChange={(event) =>
                                setFeeForm({
                                    ...feeForm,
                                    discount_type: event.target.value as FeeForm['discount_type'],
                                })
                            }
                            className="border-line bg-surface text-ink focus:border-brand w-full rounded-xl border px-4 py-3 text-sm outline-none"
                        >
                            <option value="free">Gratis ongkir</option>
                            <option value="percent">Diskon persen</option>
                        </select>
                    </label>
                    {feeForm.discount_type === 'percent' && (
                        <Input
                            label="Besar diskon (%)"
                            type="number"
                            min={0}
                            max={100}
                            value={feeForm.discount_value}
                            onChange={(event) =>
                                setFeeForm({
                                    ...feeForm,
                                    discount_value: Number(event.target.value),
                                })
                            }
                        />
                    )}
                    <label className="text-ink flex items-center gap-2 text-[12.5px] font-medium">
                        <input
                            type="checkbox"
                            checked={feeForm.is_active}
                            onChange={(event) =>
                                setFeeForm({ ...feeForm, is_active: event.target.checked })
                            }
                            className="size-4 accent-brand"
                        />
                        Aktif
                    </label>
                </div>
            </Sheet>
        </AdminLayout>
    );
}
