import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ImageUp, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/Components/layouts/AdminLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { Input } from '@/Components/ui/Input';
import { Sheet } from '@/Components/ui/Sheet';
import { Textarea } from '@/Components/ui/Textarea';
import { useToast } from '@/Context/ToastContext';
import {
    createProduct,
    createVariant,
    deleteProduct,
    deleteVariant,
    getAddonGroups,
    getCategories,
    getProductVariants,
    getProducts,
    syncProductAddonGroups,
    toggleProductSoldOut,
    updateProduct,
    updateVariant,
    uploadProductImage,
} from '@/lib/admin/api';
import { toApiError } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format/currency';
import { resolveImageUrl } from '@/lib/menu/product';
import { cn } from '@/lib/cn';
import type { AdminAddonGroup, AdminPageProps, AdminProduct, Category } from '@/types/admin';
import type { ProductVariant } from '@/types';

interface ProductForm {
    name: string;
    category_id: number;
    description: string;
    base_price: number;
    badge: '' | 'promo' | 'best_seller';
    sort_order: number;
    is_active: boolean;
    is_sold_out: boolean;
}

const emptyForm = (categoryId = 0): ProductForm => ({
    name: '',
    category_id: categoryId,
    description: '',
    base_price: 0,
    badge: '',
    sort_order: 0,
    is_active: true,
    is_sold_out: false,
});

interface VariantForm {
    id: number | null;
    type: 'size' | 'temperature';
    name: string;
    price_delta: number;
    is_default: boolean;
    sort_order: number;
}

const emptyVariant = (): VariantForm => ({
    id: null,
    type: 'size',
    name: '',
    price_delta: 0,
    is_default: false,
    sort_order: 0,
});

export default function AdminProducts({ staff }: AdminPageProps) {
    const toast = useToast();

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [addonGroups, setAddonGroups] = useState<AdminAddonGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | number>('all');
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<AdminProduct | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm());
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariant());
    const [variantSaving, setVariantSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const [productData, categoryData, groupData] = await Promise.all([
                getProducts(),
                getCategories(),
                getAddonGroups(),
            ]);
            setProducts(productData);
            setCategories(categoryData);
            setAddonGroups(groupData);
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

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                categoryFilter === 'all' || product.category_id === categoryFilter;
            const matchesSearch = term === '' || product.name.toLowerCase().includes(term);

            return matchesCategory && matchesSearch;
        });
    }, [products, search, categoryFilter]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(categories[0]?.id ?? 0));
        setSelectedGroupIds([]);
        setImagePreview(null);
        setVariantForm(emptyVariant());
        setSheetOpen(true);
    };

    const openEdit = (product: AdminProduct) => {
        setEditing(product);
        setForm({
            name: product.name,
            category_id: product.category_id,
            description: product.description ?? '',
            base_price: product.base_price,
            badge: product.badge ?? '',
            sort_order: product.sort_order,
            is_active: product.is_active,
            is_sold_out: product.is_sold_out,
        });
        setSelectedGroupIds(product.addon_groups.map((group) => group.id));
        setImagePreview(product.image_url ?? resolveImageUrl(product.image_path));
        setVariantForm(emptyVariant());
        setSheetOpen(true);
    };

    const handleSave = async () => {
        if (form.name.trim() === '' || form.category_id === 0) {
            toast.push('Nama dan kategori wajib diisi.', 'error');
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                category_id: Number(form.category_id),
                description: form.description.trim() === '' ? null : form.description.trim(),
                base_price: Number(form.base_price),
                badge: form.badge === '' ? null : form.badge,
                sort_order: Number(form.sort_order),
                is_active: form.is_active,
                is_sold_out: form.is_sold_out,
            };

            const saved = editing
                ? await updateProduct(editing.id, payload)
                : await createProduct(payload);

            await syncProductAddonGroups(saved.id, selectedGroupIds);
            const variants = await getProductVariants(saved.id);
            const complete = { ...saved, variants };

            setEditing(complete);
            setProducts((current) =>
                editing
                    ? current.map((product) => (product.id === complete.id ? complete : product))
                    : [complete, ...current],
            );
            toast.push(editing ? 'Produk diperbarui' : 'Produk dibuat');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editing) return;

        setUploading(true);

        try {
            const result = await uploadProductImage(editing.id, file);
            const updated = { ...editing, image_path: result.image_path };
            setEditing(updated);
            setImagePreview(result.image_url);
            setProducts((current) =>
                current.map((product) => (product.id === updated.id ? updated : product)),
            );
            toast.push('Gambar produk diperbarui');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleToggleSoldOut = async (product: AdminProduct) => {
        setTogglingId(product.id);

        try {
            const updated = await toggleProductSoldOut(product.id);
            setProducts((current) =>
                current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
            );
            if (editing?.id === updated.id) setEditing({ ...editing, ...updated });
            toast.push(updated.is_sold_out ? 'Ditandai habis' : 'Ditandai tersedia');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (product: AdminProduct) => {
        if (!window.confirm(`Hapus produk “${product.name}”?`)) return;

        try {
            await deleteProduct(product.id);
            setProducts((current) => current.filter((item) => item.id !== product.id));
            if (editing?.id === product.id) setSheetOpen(false);
            toast.push('Produk dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    const handleVariantSubmit = async () => {
        if (!editing || variantForm.name.trim() === '') {
            toast.push('Nama varian wajib diisi.', 'error');
            return;
        }

        setVariantSaving(true);

        try {
            const payload = {
                type: variantForm.type,
                name: variantForm.name.trim(),
                price_delta: Number(variantForm.price_delta),
                is_default: variantForm.is_default,
                sort_order: Number(variantForm.sort_order),
            };

            if (variantForm.id !== null) {
                await updateVariant(variantForm.id, payload);
            } else {
                await createVariant(editing.id, payload);
            }

            const variants = await getProductVariants(editing.id);
            setEditing({ ...editing, variants });
            setVariantForm(emptyVariant());
            toast.push('Varian disimpan');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        } finally {
            setVariantSaving(false);
        }
    };

    const handleVariantDelete = async (variant: ProductVariant) => {
        if (!editing || !window.confirm(`Hapus varian “${variant.name}”?`)) return;

        try {
            await deleteVariant(variant.id);
            const variants = await getProductVariants(editing.id);
            setEditing({ ...editing, variants });
            toast.push('Varian dihapus');
        } catch (requestError) {
            toast.push(toApiError(requestError).message, 'error');
        }
    };

    return (
        <AdminLayout staff={staff}>
            <Head title="Admin · Produk" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-brand text-[10.5px] font-bold tracking-[0.18em] uppercase">
                        Menu
                    </p>
                    <h1 className="text-ink mt-1 text-2xl font-semibold md:text-[30px]">Produk</h1>
                    <p className="text-ink-muted mt-1 text-[12px]">
                        {products.length} produk · atur harga, varian, add-on, dan ketersediaan.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah produk
                </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
                    <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari produk..."
                        className="border-line bg-surface text-ink focus:border-brand w-full rounded-xl border py-2.5 pr-3 pl-9 text-[12.5px] outline-none"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(event) =>
                        setCategoryFilter(
                            event.target.value === 'all' ? 'all' : Number(event.target.value),
                        )
                    }
                    className="border-line bg-surface text-ink focus:border-brand rounded-xl border px-3 py-2.5 text-[12.5px] outline-none"
                >
                    <option value="all">Semua kategori</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <p className="bg-danger-soft text-danger mt-4 rounded-xl px-3.5 py-2.5 text-[12px] font-medium">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="text-ink-muted flex items-center justify-center gap-2 py-24 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat produk...
                </div>
            ) : (
                <div className="border-line/70 bg-surface mt-4 overflow-hidden rounded-2xl border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-[12.5px]">
                            <thead className="bg-canvas text-ink-muted text-[10px] font-bold tracking-[0.08em] uppercase">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Harga</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-line/60 divide-y">
                                {filtered.map((product) => {
                                    const image =
                                        product.image_url ?? resolveImageUrl(product.image_path);
                                    const category = categories.find(
                                        (item) => item.id === product.category_id,
                                    );

                                    return (
                                        <tr key={product.id} className="align-middle">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-canvas-deep size-10 shrink-0 overflow-hidden rounded-xl">
                                                        {image ? (
                                                            <img
                                                                src={image}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <CoffeeArt
                                                                seed={product.name}
                                                                compact
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-ink truncate font-semibold">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-ink-muted truncate text-[10.5px]">
                                                            {product.slug}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-ink-muted px-4 py-3">
                                                {category?.name ?? '—'}
                                            </td>
                                            <td className="tabular text-ink px-4 py-3 font-semibold">
                                                {formatRupiah(product.base_price)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge
                                                        tone={
                                                            product.is_active
                                                                ? 'best_seller'
                                                                : 'sold_out'
                                                        }
                                                        label={
                                                            product.is_active ? 'Aktif' : 'Nonaktif'
                                                        }
                                                    />
                                                    {product.is_sold_out && (
                                                        <Badge tone="sold_out" label="Habis" />
                                                    )}
                                                    {product.badge === 'promo' && (
                                                        <Badge tone="promo" label="Promo" />
                                                    )}
                                                    {product.badge === 'best_seller' && (
                                                        <Badge
                                                            tone="best_seller"
                                                            label="Terlaris"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSoldOut(product)}
                                                        disabled={togglingId === product.id}
                                                        className="border-line text-ink-muted hover:border-brand/30 hover:text-brand rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        {product.is_sold_out
                                                            ? 'Tersedia'
                                                            : 'Habiskan'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(product)}
                                                        aria-label={`Edit ${product.name}`}
                                                        className="text-ink-muted hover:bg-brand-soft hover:text-brand grid size-8 place-items-center rounded-full transition-colors"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(product)}
                                                        aria-label={`Hapus ${product.name}`}
                                                        className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-8 place-items-center rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length === 0 && (
                        <p className="text-ink-muted px-4 py-12 text-center text-[12px]">
                            Tidak ada produk yang cocok.
                        </p>
                    )}
                </div>
            )}

            <Sheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={editing ? 'Edit produk' : 'Produk baru'}
                subtitle={
                    editing
                        ? `#${editing.id} · ${editing.slug}`
                        : 'Simpan dulu untuk menambah varian & gambar'
                }
                footer={
                    <div className="flex items-center gap-2 pb-1">
                        <Button variant="outline" onClick={() => setSheetOpen(false)}>
                            Tutup
                        </Button>
                        <Button fullWidth loading={saving} onClick={handleSave}>
                            {editing ? 'Simpan perubahan' : 'Simpan produk'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-5 pb-2">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            label="Nama produk"
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                        />
                        <label className="block space-y-1.5">
                            <span className="text-ink block text-[13px] font-semibold">
                                Kategori
                            </span>
                            <select
                                value={form.category_id}
                                onChange={(event) =>
                                    setForm({ ...form, category_id: Number(event.target.value) })
                                }
                                className="border-line bg-surface text-ink focus:border-brand w-full rounded-xl border px-4 py-3 text-sm outline-none"
                            >
                                <option value={0} disabled>
                                    Pilih kategori
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Input
                            label="Harga dasar (Rp)"
                            type="number"
                            min={0}
                            value={form.base_price}
                            onChange={(event) =>
                                setForm({ ...form, base_price: Number(event.target.value) })
                            }
                        />
                        <label className="block space-y-1.5">
                            <span className="text-ink block text-[13px] font-semibold">Badge</span>
                            <select
                                value={form.badge}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        badge: event.target.value as ProductForm['badge'],
                                    })
                                }
                                className="border-line bg-surface text-ink focus:border-brand w-full rounded-xl border px-4 py-3 text-sm outline-none"
                            >
                                <option value="">Tanpa badge</option>
                                <option value="promo">Promo</option>
                                <option value="best_seller">Terlaris</option>
                            </select>
                        </label>
                    </div>

                    <Textarea
                        label="Deskripsi"
                        rows={3}
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            label="Urutan tampil"
                            type="number"
                            min={0}
                            value={form.sort_order}
                            onChange={(event) =>
                                setForm({ ...form, sort_order: Number(event.target.value) })
                            }
                        />
                        <div className="flex flex-col justify-end gap-2">
                            <Toggle
                                label="Aktif di menu"
                                checked={form.is_active}
                                onChange={(checked) => setForm({ ...form, is_active: checked })}
                            />
                            <Toggle
                                label="Sedang habis"
                                checked={form.is_sold_out}
                                onChange={(checked) => setForm({ ...form, is_sold_out: checked })}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-ink text-[13px] font-semibold">Add-on yang tersedia</p>
                        <p className="text-ink-muted text-[11px]">
                            Disimpan bersama produk. Kosongkan jika tidak ada.
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {addonGroups.map((group) => {
                                const checked = selectedGroupIds.includes(group.id);

                                return (
                                    <label
                                        key={group.id}
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors',
                                            checked
                                                ? 'border-brand bg-brand-mist text-brand'
                                                : 'border-line bg-surface text-ink-muted',
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                setSelectedGroupIds((current) =>
                                                    checked
                                                        ? current.filter((id) => id !== group.id)
                                                        : [...current, group.id],
                                                )
                                            }
                                            className="size-4 accent-brand"
                                        />
                                        {group.name}
                                        <span className="ml-auto text-[10px] tracking-wide uppercase opacity-70">
                                            {group.selection_type}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {editing ? (
                        <>
                            <div>
                                <p className="text-ink text-[13px] font-semibold">Gambar produk</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="bg-canvas-deep size-20 overflow-hidden rounded-2xl">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt={editing.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <CoffeeArt seed={editing.name} compact />
                                        )}
                                    </div>
                                    <label className="border-line bg-surface text-ink-muted hover:border-brand/30 hover:text-brand inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-[11.5px] font-semibold transition-colors">
                                        {uploading ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <ImageUp className="size-3.5" />
                                        )}
                                        Unggah gambar
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                            className="sr-only"
                                        />
                                    </label>
                                    <span className="text-ink-muted text-[10.5px]">
                                        JPG/PNG/WebP maks 2 MB
                                    </span>
                                </div>
                            </div>

                            <div className="border-line/70 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-ink text-[13px] font-semibold">Varian</p>
                                    <span className="text-ink-muted text-[10.5px]">
                                        {editing.variants.length} varian
                                    </span>
                                </div>

                                <div className="mt-2 space-y-2">
                                    {editing.variants.map((variant) => (
                                        <div
                                            key={variant.id}
                                            className="border-line/70 bg-surface flex items-center gap-2 rounded-xl border px-3 py-2"
                                        >
                                            <span className="bg-canvas text-ink-muted rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-wide uppercase">
                                                {variant.type}
                                            </span>
                                            <span className="text-ink text-[12px] font-semibold">
                                                {variant.name}
                                            </span>
                                            <span className="tabular text-ink-muted text-[11px]">
                                                {variant.price_delta > 0
                                                    ? `+${formatRupiah(variant.price_delta)}`
                                                    : 'Gratis'}
                                            </span>
                                            {variant.is_default && (
                                                <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-[9.5px] font-bold">
                                                    Default
                                                </span>
                                            )}
                                            <div className="ml-auto flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setVariantForm({
                                                            id: variant.id,
                                                            type: variant.type,
                                                            name: variant.name,
                                                            price_delta: variant.price_delta,
                                                            is_default: variant.is_default,
                                                            sort_order: variant.sort_order,
                                                        })
                                                    }
                                                    aria-label={`Edit varian ${variant.name}`}
                                                    className="text-ink-muted hover:bg-brand-soft hover:text-brand grid size-7 place-items-center rounded-full"
                                                >
                                                    <Pencil className="size-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleVariantDelete(variant)}
                                                    aria-label={`Hapus varian ${variant.name}`}
                                                    className="text-ink-muted hover:bg-danger-soft hover:text-danger grid size-7 place-items-center rounded-full"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-canvas mt-3 rounded-xl p-3">
                                    <div className="grid gap-2 sm:grid-cols-[110px_1fr_120px]">
                                        <select
                                            value={variantForm.type}
                                            onChange={(event) =>
                                                setVariantForm({
                                                    ...variantForm,
                                                    type: event.target.value as VariantForm['type'],
                                                })
                                            }
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-2 py-2 text-[12px] outline-none"
                                        >
                                            <option value="size">Ukuran</option>
                                            <option value="temperature">Suhu</option>
                                        </select>
                                        <input
                                            value={variantForm.name}
                                            onChange={(event) =>
                                                setVariantForm({
                                                    ...variantForm,
                                                    name: event.target.value,
                                                })
                                            }
                                            placeholder="Nama varian"
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-3 py-2 text-[12px] outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={variantForm.price_delta}
                                            onChange={(event) =>
                                                setVariantForm({
                                                    ...variantForm,
                                                    price_delta: Number(event.target.value),
                                                })
                                            }
                                            placeholder="+Harga"
                                            className="border-line bg-surface text-ink focus:border-brand rounded-lg border px-3 py-2 text-[12px] outline-none"
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <label className="text-ink-muted flex items-center gap-1.5 text-[11.5px]">
                                            <input
                                                type="checkbox"
                                                checked={variantForm.is_default}
                                                onChange={(event) =>
                                                    setVariantForm({
                                                        ...variantForm,
                                                        is_default: event.target.checked,
                                                    })
                                                }
                                                className="size-3.5 accent-brand"
                                            />
                                            Default
                                        </label>
                                        <Button
                                            size="sm"
                                            loading={variantSaving}
                                            onClick={handleVariantSubmit}
                                        >
                                            {variantForm.id ? 'Simpan varian' : 'Tambah varian'}
                                        </Button>
                                        {variantForm.id !== null && (
                                            <button
                                                type="button"
                                                onClick={() => setVariantForm(emptyVariant())}
                                                className="text-ink-muted hover:text-ink text-[11px] font-semibold"
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="border-line text-ink-muted rounded-xl border border-dashed px-3 py-3 text-[11.5px]">
                            Simpan produk terlebih dahulu untuk mengunggah gambar dan menambah
                            varian.
                        </p>
                    )}
                </div>
            </Sheet>
        </AdminLayout>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="text-ink flex items-center gap-2 text-[12.5px] font-medium">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4 accent-brand"
            />
            {label}
        </label>
    );
}
