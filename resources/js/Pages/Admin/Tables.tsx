import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Copy, ExternalLink, Loader2, Pencil, Plus, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Sheet } from '@/Components/ui/Sheet';
import { useToast } from '@/Context/ToastContext';
import {
    createTable,
    deleteTable,
    getTables,
    regenerateTableToken,
    updateTable,
} from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import type { AdminPageProps, AdminTable } from '@/types/admin';

interface TableForm {
    number: string;
    is_active: boolean;
}

const emptyForm = (): TableForm => ({ number: '', is_active: true });

export default function AdminTables({ staff }: AdminPageProps) {
    const toast = useToast();

    const [tables, setTables] = useState<AdminTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<AdminTable | null>(null);
    const [form, setForm] = useState<TableForm>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            setTables(await getTables());
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

    const sorted = useMemo(
        () =>
            [...tables].sort((a, b) =>
                a.number.localeCompare(b.number, undefined, { numeric: true }),
            ),
        [tables],
    );

    const tableUrl = (token: string) => `${window.location.origin}/meja/${token}`;

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setSheetOpen(true);
    };

    const openEdit = (table: AdminTable) => {
        setEditing(table);
        setForm({ number: table.number, is_active: table.is_active });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        if (form.number.trim() === '') {
            toast.push('Nomor meja wajib diisi.', 'error');
            return;
        }

        setSaving(true);

        try {
            const payload = { number: form.number.trim(), is_active: form.is_active };

            if (editing) {
                await updateTable(editing.id, payload);
            } else {
                await createTable(payload);
            }

            await load();
            setSheetOpen(false);
            toast.push(editing ? 'Meja diperbarui' : 'Meja dibuat');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async (table: AdminTable) => {
        if (!window.confirm(`Buat token QR baru untuk meja ${table.number}? Token lama langsung tidak berlaku.`)) {
            return;
        }

        setBusyId(table.id);

        try {
            const updated = await regenerateTableToken(table.id);
            setTables((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            toast.push(`Token meja ${table.number} diperbarui`);
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (table: AdminTable) => {
        if (!window.confirm(`Hapus meja ${table.number}?`)) return;

        try {
            await deleteTable(table.id);
            setTables((current) => current.filter((item) => item.id !== table.id));
            toast.push('Meja dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    const handleCopy = async (table: AdminTable) => {
        try {
            await navigator.clipboard.writeText(tableUrl(table.qr_token));
            toast.push('Link QR disalin');
        } catch {
            toast.push('Gagal menyalin. Salin manual dari kolom link.', 'error');
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Meja & QR" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">Layanan</p>
                    <h1 className="mt-1 text-2xl font-semibold text-ink md:text-[30px]">Meja & QR</h1>
                    <p className="mt-1 text-[12px] text-ink-muted">
                        Setiap meja punya token QR untuk membuka menu dalam mode dine-in.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah meja
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
                    Memuat meja...
                </div>
            ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sorted.map((table) => (
                        <article
                            key={table.id}
                            className="rounded-2xl border border-line/70 bg-surface p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                                        <QrCode className="size-5" />
                                    </span>
                                    <div>
                                        <p className="font-display text-xl font-semibold leading-none text-ink">
                                            Meja {table.number}
                                        </p>
                                        <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                                            {table.is_active ? 'Aktif' : 'Nonaktif'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(table)}
                                        aria-label={`Edit meja ${table.number}`}
                                        className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-brand-soft hover:text-brand"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(table)}
                                        aria-label={`Hapus meja ${table.number}`}
                                        className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-3 truncate rounded-lg bg-canvas px-2.5 py-2 font-mono text-[10px] text-ink-muted">
                                {tableUrl(table.qr_token)}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleCopy(table)}
                                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-muted hover:border-brand/30 hover:text-brand"
                                >
                                    <Copy className="size-3" />
                                    Salin
                                </button>
                                <a
                                    href={tableUrl(table.qr_token)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-muted hover:border-brand/30 hover:text-brand"
                                >
                                    <ExternalLink className="size-3" />
                                    Buka
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleRegenerate(table)}
                                    disabled={busyId === table.id}
                                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-muted hover:border-warning/40 hover:text-warning disabled:opacity-50"
                                >
                                    {busyId === table.id ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <RefreshCw className="size-3" />
                                    )}
                                    Token baru
                                </button>
                            </div>
                        </article>
                    ))}

                    {sorted.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-line px-4 py-16 text-center text-[12px] text-ink-muted sm:col-span-2 xl:col-span-3">
                            Belum ada meja. Tambahkan meja untuk membuat QR dine-in.
                        </p>
                    )}
                </div>
            )}

            <p className="mt-4 text-[11px] text-ink-muted">
                Cetak QR dari link di atas. Pelanggan yang memindai QR akan otomatis masuk mode
                dine-in pada meja tersebut.
            </p>

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={editing ? `Edit meja ${editing.number}` : 'Meja baru'}
                footer={
                    <div className="flex items-center gap-2 pb-1">
                        <Button variant="outline" onClick={() => setSheetOpen(false)}>
                            Tutup
                        </Button>
                        <Button fullWidth loading={saving} onClick={handleSave}>
                            Simpan
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3 pb-2">
                    <Input
                        label="Nomor / nama meja"
                        value={form.number}
                        onChange={(event) => setForm({ ...form, number: event.target.value })}
                    />
                    <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                                setForm({ ...form, is_active: event.target.checked })
                            }
                            className="size-4 accent-[#1E5B3E]"
                        />
                        Aktif
                    </label>
                    {!editing && (
                        <p className="rounded-xl bg-canvas px-3 py-2 text-[11px] text-ink-muted">
                            Token QR dibuat otomatis oleh server.
                        </p>
                    )}
                </div>
            </Sheet>
        </AdminLayout>
    );
}
