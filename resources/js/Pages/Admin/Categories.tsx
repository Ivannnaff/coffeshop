import { useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Sheet } from '@/Components/ui/Sheet';
import { useToast } from '@/Context/ToastContext';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import type { AdminPageProps, Category } from '@/types/admin';

interface CategoryForm {
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
}

const emptyForm = (): CategoryForm => ({
    name: '',
    slug: '',
    sort_order: 0,
    is_active: true,
});

export default function AdminCategories({ staff }: AdminPageProps) {
    const toast = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm());
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setCategories(await getCategories());
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
        setEditing(null);
        setForm(emptyForm());
        setSheetOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        setForm({
            name: category.name,
            slug: category.slug,
            sort_order: category.sort_order,
            is_active: category.is_active,
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        if (form.name.trim() === '') {
            toast.push('Nama kategori wajib diisi.', 'error');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                slug: form.slug.trim() === '' ? undefined : form.slug.trim(),
                sort_order: Number(form.sort_order),
                is_active: form.is_active,
            };

            if (editing) {
                await updateCategory(editing.id, payload);
            } else {
                await createCategory(payload);
            }

            await load();
            setSheetOpen(false);
            toast.push(editing ? 'Kategori diperbarui' : 'Kategori dibuat');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (!window.confirm(`Hapus kategori “${category.name}”?`)) return;

        try {
            await deleteCategory(category.id);
            setCategories((current) => current.filter((item) => item.id !== category.id));
            toast.push('Kategori dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Kategori" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-brand text-[10.5px] font-bold tracking-[0.18em] uppercase">
                        Menu
                    </p>
                    <h1 className="text-ink mt-1 text-2xl font-semibold md:text-[30px]">
                        Kategori
                    </h1>
                    <p className="text-ink-muted mt-1 text-[12px]">
                        Kelompokkan menu agar mudah dicari pelanggan.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah kategori
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
                    Memuat kategori...
                </div>
            ) : categories.length === 0 ? (
                <div className="border-line bg-surface mt-6 rounded-2xl border border-dashed px-4 py-16 text-center">
                    <Tags className="text-ink-muted mx-auto size-8" />
                    <p className="text-ink mt-3 text-sm font-semibold">Belum ada kategori</p>
                    <p className="text-ink-muted mt-1 text-[12px]">
                        Tambahkan kategori pertama untuk mulai menyusun menu.
                    </p>
                </div>
            ) : (
                <div className="border-line/70 bg-surface mt-4 overflow-hidden rounded-2xl border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left text-[12.5px]">
                            <thead className="bg-canvas text-ink-muted text-[10px] font-bold tracking-[0.08em] uppercase">
                                <tr>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">Slug</th>
                                    <th className="px-4 py-3">Urutan</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-line/60 divide-y">
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="text-ink px-4 py-3 font-semibold">
                                            {category.name}
                                        </td>
                                        <td className="text-ink-muted px-4 py-3">
                                            {category.slug}
                                        </td>
                                        <td className="tabular text-ink-muted px-4 py-3">
                                            {category.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                tone={
                                                    category.is_active ? 'best_seller' : 'sold_out'
                                                }
                                                label={category.is_active ? 'Aktif' : 'Nonaktif'}
                                            />
                                        </td>
                                        <td className="tabular text-ink-muted px-4 py-3">
                                            {category.products_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(category)}
                                                    aria-label={`Edit ${category.name}`}
                                                    className="text-ink-muted hover:bg-brand-soft hover:text-brand grid size-8 place-items-center rounded-full transition-colors"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(category)}
                                                    aria-label={`Hapus ${category.name}`}
                                                    className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-8 place-items-center rounded-full transition-colors"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={editing ? 'Edit kategori' : 'Kategori baru'}
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
                        label="Nama kategori"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                    <Input
                        label="Slug (opsional)"
                        hint="Kosongkan untuk dibuat otomatis dari nama."
                        value={form.slug}
                        onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    />
                    <Input
                        label="Urutan tampil"
                        type="number"
                        min={0}
                        value={form.sort_order}
                        onChange={(event) =>
                            setForm({ ...form, sort_order: Number(event.target.value) })
                        }
                    />
                    <label className="text-ink flex items-center gap-2 text-[12.5px] font-medium">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                                setForm({ ...form, is_active: event.target.checked })
                            }
                            className="size-4 accent-brand"
                        />
                        Aktif di menu
                    </label>
                </div>
            </Sheet>
        </AdminLayout>
    );
}
