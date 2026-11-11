import { CartItem } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format/currency';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartLineProps {
    item: CartItem;
    onUpdateQty: (cartItemId: number, qty: number) => Promise<unknown>;
    onRemove: (cartItemId: number) => Promise<unknown>;
}

export function CartLine({ item, onUpdateQty, onRemove }: CartLineProps) {
    const variantText = [item.size_name, item.temperature_name].filter(Boolean).join(' • ');
    const addonText = item.addons.map((addon) => addon.name).join(', ');

    return (
        <div
            className={`flex flex-col gap-2 rounded-xl border p-3.5 ${
                item.is_available ? 'border-line bg-surface' : 'border-danger/40 bg-danger/5'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="font-semibold text-ink">{item.product_name}</h4>
                    {variantText && <p className="text-[13px] text-ink-muted">{variantText}</p>}
                    {addonText && <p className="text-[13px] text-ink-muted">Add-on: {addonText}</p>}
                    {item.note && <p className="text-[13px] text-accent">Catatan: {item.note}</p>}
                    {!item.is_available && (
                        <p className="mt-1 text-[13px] font-medium text-danger">
                            {item.unavailable_reason || 'Tidak tersedia'}
                        </p>
                    )}
                </div>
                <p className="tabular shrink-0 font-semibold text-brand">{formatRupiah(item.line_total)}</p>
            </div>

            <div className="flex items-center justify-between border-t border-line/60 pt-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))}
                        disabled={item.qty <= 1}
                        aria-label={`Kurangi jumlah ${item.product_name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface hover:bg-canvas disabled:opacity-50"
                    >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="tabular w-5 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, Math.min(99, item.qty + 1))}
                        aria-label={`Tambah jumlah ${item.product_name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface hover:bg-canvas"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger/10"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Hapus
                </button>
            </div>
        </div>
    );
}
