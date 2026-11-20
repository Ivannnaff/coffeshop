import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Sheet } from '@/Components/ui/Sheet';
import { useToast } from '@/Context/ToastContext';
import {
    createAddon,
    createAddonGroup,
    deleteAddon,
    deleteAddonGroup,
    getAddonGroups,
    updateAddon,
    updateAddonGroup,
} from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import { cn } from '@/lib/cn';
import type { AdminAddonGroup, AdminPageProps } from '@/types/admin';
import type { Addon } from '@/types';

interface GroupForm {
    name: string;
    selection_type: 'single' | 'multiple';
    min_select: number;
    max_select: number;
    is_active: boolean;
}

interface AddonForm {
    id: number | null;
    name: string;
    price_delta: number;
    is_active: boolean;
    is_sold_out: boolean;
    sort_order: number;
}

const emptyGroup = (): GroupForm => ({
    name: '',
    selection_type: 'single',
    min_select: 0,
    max_select: 1,
    is_active: true,
});

const emptyAddon = (): AddonForm => ({
    id: null,
    name: '',
    price_delta: 0,
    is_active: true,
    is_sold_out: false,
    sort_order: 0,
});

export default function AdminAddons({ staff }: AdminPageProps) {
    const toast = useToast();

    const [groups, setGroups] = useState<AdminAddonGroup[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [groupSheetOpen, setGroupSheetOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<AdminAddonGroup | null>(null);
    const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroup());
    const [groupSaving, setGroupSaving] = useState(false);

    const [addonForm, setAddonForm] = useState<AddonForm>(emptyAddon());
    const [addonSaving, setAddonSaving] = useState(false);

    const load = useCallback(async (selectId?: number) => {
        try {
            const data = await getAddonGroups();
            setGroups(data);
            setSelectedId((current) => selectId ?? current ?? data[0]?.id ?? null);
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

    const selected = useMemo(
        () => groups.find((group) => group.id === selectedId) ?? null,
        [groups, selectedId],
    );

    const addons: Addon[] = selected?.addons ?? [];

    const openCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm(emptyGroup());
        setGroupSheetOpen(true);
    };

    const openEditGroup = (group: AdminAddonGroup) => {
        setEditingGroup(group);
        setGroupForm({
            name: group.name,
            selection_type: group.selection_type,
            min_select: group.min_select,
            max_select: group.max_select ?? 0,
            is_active: group.is_active,
        });
        setGroupSheetOpen(true);
    };

    const handleGroupSave = async () => {
        if (groupForm.name.trim() === '') {
            toast.push('Nama grup wajib diisi.', 'error');
            return;
        }

        setGroupSaving(true);

        try {
            const payload = {
                name: groupForm.name.trim(),
                selection_type: groupForm.selection_type,
                min_select: Number(groupForm.min_select),
                max_select: Number(groupForm.max_select),
                is_active: groupForm.is_active,
            };

            let savedId = editingGroup?.id;

            if (editingGroup) {
                await updateAddonGroup(editingGroup.id, payload);
            } else {
                const created = await createAddonGroup(payload);
                savedId = created.id;
            }

            await load(savedId);
            setGroupSheetOpen(false);
            toast.push(editingGroup ? 'Grup diperbarui' : 'Grup dibuat');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setGroupSaving(false);
        }
    };

    const handleGroupDelete = async (group: AdminAddonGroup) => {
        if (!window.confirm(`Hapus grup “${group.name}” beserta add-on-nya?`)) return;

        try {
            await deleteAddonGroup(group.id);
            setSelectedId(null);
            await load();
            toast.push('Grup dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    const handleAddonSubmit = async () => {
        if (!selected || addonForm.name.trim() === '') {
            toast.push('Nama add-on wajib diisi.', 'error');
            return;
        }

        setAddonSaving(true);

        try {
            const payload = {
                name: addonForm.name.trim(),
                price_delta: Number(addonForm.price_delta),
                is_active: addonForm.is_active,
                is_sold_out: addonForm.is_sold_out,
                sort_order: Number(addonForm.sort_order),
            };

            if (addonForm.id !== null) {
                await updateAddon(addonForm.id, payload);
            } else {
                await createAddon(selected.id, payload);
            }

            await load(selected.id);
            setAddonForm(emptyAddon());
            toast.push(addonForm.id ? 'Add-on diperbarui' : 'Add-on ditambahkan');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setAddonSaving(false);
        }
    };

    const handleAddonDelete = async (addon: Addon) => {
        if (!window.confirm(`Hapus add-on “${addon.name}”?`)) return;

        try {
            await deleteAddon(addon.id);
            await load(selectedId ?? undefined);
            toast.push('Add-on dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Add-on" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-brand text-[10.5px] font-bold tracking-[0.18em] uppercase">
                        Menu
                    </p>
                    <h1 className="text-ink mt-1 text-2xl font-semibold md:text-[30px]">Add-on</h1>
                    <p className="text-ink-muted mt-1 text-[12px]">
                        Grup pilihan seperti level gula atau topping tambahan.
                    </p>
                </div>
                <Button onClick={openCreateGroup}>
                    <Plus className="size-4" />
                    Tambah grup
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
                    Memuat add-on...
                </div>
            ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                    <section className="border-line/70 bg-surface rounded-2xl border p-2.5">
                        <h2 className="text-ink-muted px-2 py-1 text-[12px] font-bold tracking-[0.1em] uppercase">
                            Grup add-on
                        </h2>
                        <div className="mt-1 space-y-1.5">
                            {groups.length === 0 && (
                                <p className="border-line text-ink-muted rounded-xl border border-dashed px-3 py-8 text-center text-[11.5px]">
                                    Belum ada grup add-on.
                                </p>
                            )}
                            {groups.map((group) => (
                                <div
                                    key={group.id}
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors',
                                        selectedId === group.id
                                            ? 'bg-brand text-white'
                                            : 'hover:bg-canvas-deep',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(group.id);
                                            setAddonForm(emptyAddon());
                                        }}
                                        className="min-w-0 flex-1 text-left"
                                    >
                                        <span className="block truncate text-[12.5px] font-semibold">
                                            {group.name}
                                        </span>
                                        <span
                                            className={cn(
                                                'block text-[10.5px]',
                                                selectedId === group.id
                                                    ? 'text-white/60'
                                                    : 'text-ink-muted',
                                            )}
                                        >
                                            {group.selection_type} · {group.addons?.length ?? 0}{' '}
                                            add-on
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEditGroup(group)}
                                        aria-label={`Edit ${group.name}`}
                                        className={cn(
                                            'grid size-7 place-items-center rounded-full',
                                            selectedId === group.id
                                                ? 'text-white/70 hover:bg-white/15'
                                                : 'text-ink-muted hover:bg-brand-soft hover:text-brand',
                                        )}
                                    >
                                        <Pencil className="size-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGroupDelete(group)}
                                        aria-label={`Hapus ${group.name}`}
                                        className={cn(
                                            'grid size-7 place-items-center rounded-full',
                                            selectedId === group.id
                                                ? 'text-white/70 hover:bg-white/15'
                                                : 'text-ink-muted hover:bg-danger-soft hover:text-danger',
                                        )}
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="border-line/70 bg-surface rounded-2xl border p-4">
                        {selected ? (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-ink text-[15px] font-semibold">
                                            {selected.name}
                                        </h2>
                                        <p className="text-ink-muted text-[11px]">
                                            {selected.selection_type === 'single'
                                                ? 'Pilih satu'
                                                : `Pilih ${selected.min_select}–${selected.max_select ?? '∞'}`}
                                            {' · '}
                                            {selected.is_active ? 'Aktif' : 'Nonaktif'}
                                        </p>
                                    </div>
                                    <Badge
                                        tone={selected.is_active ? 'best_seller' : 'sold_out'}
                                        label={selected.is_active ? 'Aktif' : 'Nonaktif'}
                                    />
                                </div>

                                <div className="mt-4 space-y-2">
                                    {addons.length === 0 && (
                                        <p className="border-line text-ink-muted rounded-xl border border-dashed px-3 py-8 text-center text-[11.5px]">
                                            Belum ada add-on di grup ini.
                                        </p>
                                    )}
                                    {addons.map((addon) => (
                                        <div
                                            key={addon.id}
                                            className="border-line/70 flex items-center gap-2 rounded-xl border px-3 py-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-ink truncate text-[12.5px] font-semibold">
                                                    {addon.name}
                                                </p>
                                                <p className="text-ink-muted text-[10.5px]">
                                                    {addon.price_delta > 0
                                                        ? `+${formatRupiah(addon.price_delta)}`
                                                        : 'Gratis'}
                                                    {addon.is_sold_out && ' · habis'}
                                                    {!addon.is_active && ' · nonaktif'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAddonForm({
                                                        id: addon.id,
                                                        name: addon.name,
                                                        price_delta: addon.price_delta,
                                                        is_active: addon.is_active,
                                                        is_sold_out: addon.is_sold_out,
                                                        sort_order: addon.sort_order,
                                                    })
                                                }
                                                aria-label={`Edit ${addon.name}`}
                                                className="text-ink-muted hover:bg-brand-soft hover:text-brand grid size-8 place-items-center rounded-full"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAddonDelete(addon)}
                                                aria-label={`Hapus ${addon.name}`}
                                                className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-8 place-items-center rounded-full"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-canvas mt-4 rounded-xl p-3">
                                    <p className="text-ink-muted text-[11.5px] font-bold tracking-wide uppercase">
                                        {addonForm.id ? 'Edit add-on' : 'Tambah add-on'}
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_120px_110px]">
                                        <input
                                            value={addonForm.name}
                                            onChange={(event) =>
                                                setAddonForm({
                                                    ...addonForm,
                                                    name: event.target.value,
                                                })
                                            }
                                            placeholder="Nama add-on"
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-3 py-2 text-[12px] outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={addonForm.price_delta}
                                            onChange={(event) =>
                                                setAddonForm({
                                                    ...addonForm,
                                                    price_delta: Number(event.target.value),
                                                })
                                            }
                                            placeholder="+Harga"
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-3 py-2 text-[12px] outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={addonForm.sort_order}
                                            onChange={(event) =>
                                                setAddonForm({
                                                    ...addonForm,
                                                    sort_order: Number(event.target.value),
                                                })
                                            }
                                            placeholder="Urutan"
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-3 py-2 text-[12px] outline-none"
                                        />
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-4">
                                        <label className="text-ink-muted flex items-center gap-1.5 text-[11.5px]">
                                            <input
                                                type="checkbox"
                                                checked={addonForm.is_active}
                                                onChange={(event) =>
                                                    setAddonForm({
                                                        ...addonForm,
                                                        is_active: event.target.checked,
                                                    })
                                                }
                                                className="size-3.5 accent-brand"
                                            />
                                            Aktif
                                        </label>
                                        <label className="text-ink-muted flex items-center gap-1.5 text-[11.5px]">
                                            <input
                                                type="checkbox"
                                                checked={addonForm.is_sold_out}
                                                onChange={(event) =>
                                                    setAddonForm({
                                                        ...addonForm,
                                                        is_sold_out: event.target.checked,
                                                    })
                                                }
                                                className="size-3.5 accent-brand"
                                            />
                                            Habis
                                        </label>
                                        <Button
                                            size="sm"
                                            loading={addonSaving}
                                            onClick={handleAddonSubmit}
                                        >
                                            {addonForm.id ? 'Simpan' : 'Tambah'}
                                        </Button>
                                        {addonForm.id !== null && (
                                            <button
                                                type="button"
                                                onClick={() => setAddonForm(emptyAddon())}
                                                className="text-ink-muted hover:text-ink text-[11px] font-semibold"
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Layers className="text-ink-muted size-8" />
                                <p className="text-ink mt-3 text-sm font-semibold">
                                    Pilih grup add-on
                                </p>
                                <p className="text-ink-muted mt-1 text-[12px]">
                                    Atau buat grup baru untuk mulai.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <Sheet
                open={groupSheetOpen}
                onClose={() => setGroupSheetOpen(false)}
                title={editingGroup ? 'Edit grup add-on' : 'Grup add-on baru'}
                footer={
                    <div className="flex items-center gap-2 pb-1">
                        <Button variant="outline" onClick={() => setGroupSheetOpen(false)}>
                            Tutup
                        </Button>
                        <Button fullWidth loading={groupSaving} onClick={handleGroupSave}>
                            Simpan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3 pb-2">
                    <Input
                        label="Nama grup"
                        value={groupForm.name}
                        onChange={(event) =>
                            setGroupForm({ ...groupForm, name: event.target.value })
                        }
                    />
                    <label className="block space-y-1.5">
                        <span className="text-ink block text-[13px] font-semibold">
                            Tipe pilihan
                        </span>
                        <select
                            value={groupForm.selection_type}
                            onChange={(event) =>
                                setGroupForm({
                                    ...groupForm,
                                    selection_type: event.target
                                        .value as GroupForm['selection_type'],
                                })
                            }
                            className="border-line bg-surface text-ink focus:border-brand w-full rounded-xl border px-4 py-3 text-sm outline-none"
                        >
                            <option value="single">Pilih satu</option>
                            <option value="multiple">Pilih banyak</option>
                        </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Minimal pilih"
                            type="number"
                            min={0}
                            value={groupForm.min_select}
                            onChange={(event) =>
                                setGroupForm({
                                    ...groupForm,
                                    min_select: Number(event.target.value),
                                })
                            }
                        />
                        <Input
                            label="Maksimal pilih"
                            type="number"
                            min={0}
                            value={groupForm.max_select}
                            onChange={(event) =>
                                setGroupForm({
                                    ...groupForm,
                                    max_select: Number(event.target.value),
                                })
                            }
                        />
                    </div>
                    <label className="text-ink flex items-center gap-2 text-[12.5px] font-medium">
                        <input
                            type="checkbox"
                            checked={groupForm.is_active}
                            onChange={(event) =>
                                setGroupForm({ ...groupForm, is_active: event.target.checked })
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
