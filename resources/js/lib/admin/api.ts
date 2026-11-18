import axios from 'axios';
import type {
    AdminAddonGroup,
    AdminProduct,
    AdminTable,
    Category,
    DeliveryFeeRule,
    DeliveryZone,
    ProductVariant,
    ReportSummary,
    StoreSettings,
} from '@/types/admin';

const client = axios.create({
    baseURL: '/admin',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export async function getCategories(): Promise<Category[]> {
    const response = await client.get<{ data: Category[] }>('/categories');

    return response.data.data;
}

export async function createCategory(payload: Record<string, unknown>): Promise<Category> {
    const response = await client.post<{ data: Category }>('/categories', payload);

    return response.data.data;
}

export async function updateCategory(id: number, payload: Record<string, unknown>): Promise<Category> {
    const response = await client.put<{ data: Category }>(`/categories/${id}`, payload);

    return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
    await client.delete(`/categories/${id}`);
}

export async function getProducts(): Promise<AdminProduct[]> {
    const response = await client.get<{ data: AdminProduct[] }>('/products');

    return response.data.data;
}

export async function createProduct(payload: Record<string, unknown>): Promise<AdminProduct> {
    const response = await client.post<{ data: AdminProduct }>('/products', payload);

    return response.data.data;
}

export async function updateProduct(id: number, payload: Record<string, unknown>): Promise<AdminProduct> {
    const response = await client.put<{ data: AdminProduct }>(`/products/${id}`, payload);

    return response.data.data;
}

export async function deleteProduct(id: number): Promise<void> {
    await client.delete(`/products/${id}`);
}

export async function toggleProductSoldOut(id: number): Promise<AdminProduct> {
    const response = await client.patch<{ data: AdminProduct }>(`/products/${id}/sold-out`);

    return response.data.data;
}

export async function uploadProductImage(
    id: number,
    file: File,
): Promise<{ image_path: string; image_url: string }> {
    const form = new FormData();
    form.append('image', file);

    const response = await client.post<{ data: { image_path: string; image_url: string } }>(
        `/products/${id}/image`,
        form,
    );

    return response.data.data;
}

export async function syncProductAddonGroups(id: number, addonGroupIds: number[]): Promise<void> {
    await client.put(`/products/${id}/addon-groups`, { addon_group_ids: addonGroupIds });
}

export async function getProductVariants(productId: number): Promise<ProductVariant[]> {
    const response = await client.get<{ data: ProductVariant[] }>(`/products/${productId}/variants`);

    return response.data.data;
}

export async function createVariant(
    productId: number,
    payload: Record<string, unknown>,
): Promise<ProductVariant> {
    const response = await client.post<{ data: ProductVariant }>(
        `/products/${productId}/variants`,
        payload,
    );

    return response.data.data;
}

export async function updateVariant(id: number, payload: Record<string, unknown>): Promise<ProductVariant> {
    const response = await client.put<{ data: ProductVariant }>(`/variants/${id}`, payload);

    return response.data.data;
}

export async function deleteVariant(id: number): Promise<void> {
    await client.delete(`/variants/${id}`);
}

export async function getAddonGroups(): Promise<AdminAddonGroup[]> {
    const response = await client.get<{ data: AdminAddonGroup[] }>('/addon-groups');

    return response.data.data;
}

export async function createAddonGroup(payload: Record<string, unknown>): Promise<AdminAddonGroup> {
    const response = await client.post<{ data: AdminAddonGroup }>('/addon-groups', payload);

    return response.data.data;
}

export async function updateAddonGroup(
    id: number,
    payload: Record<string, unknown>,
): Promise<AdminAddonGroup> {
    const response = await client.put<{ data: AdminAddonGroup }>(`/addon-groups/${id}`, payload);

    return response.data.data;
}

export async function deleteAddonGroup(id: number): Promise<void> {
    await client.delete(`/addon-groups/${id}`);
}

export async function getAddons(groupId: number): Promise<AdminAddonGroup['addons']> {
    const response = await client.get<{ data: NonNullable<AdminAddonGroup['addons']> }>(
        `/addon-groups/${groupId}/addons`,
    );

    return response.data.data;
}

export async function createAddon(
    groupId: number,
    payload: Record<string, unknown>,
): Promise<void> {
    await client.post(`/addon-groups/${groupId}/addons`, payload);
}

export async function updateAddon(id: number, payload: Record<string, unknown>): Promise<void> {
    await client.put(`/addons/${id}`, payload);
}

export async function deleteAddon(id: number): Promise<void> {
    await client.delete(`/addons/${id}`);
}

export async function getTables(): Promise<AdminTable[]> {
    const response = await client.get<{ data: AdminTable[] }>('/tables');

    return response.data.data;
}

export async function createTable(payload: Record<string, unknown>): Promise<AdminTable> {
    const response = await client.post<{ data: AdminTable }>('/tables', payload);

    return response.data.data;
}

export async function updateTable(id: number, payload: Record<string, unknown>): Promise<AdminTable> {
    const response = await client.put<{ data: AdminTable }>(`/tables/${id}`, payload);

    return response.data.data;
}

export async function deleteTable(id: number): Promise<void> {
    await client.delete(`/tables/${id}`);
}

export async function regenerateTableToken(id: number): Promise<AdminTable> {
    const response = await client.post<{ data: AdminTable }>(`/tables/${id}/regenerate-token`);

    return response.data.data;
}

export async function getStoreSettings(): Promise<StoreSettings> {
    const response = await client.get<{ data: StoreSettings }>('/store-settings');

    return response.data.data;
}

export async function updateStoreSettings(payload: Record<string, unknown>): Promise<StoreSettings> {
    const response = await client.put<{ data: StoreSettings }>('/store-settings', payload);

    return response.data.data;
}

export async function getReportSummary(params: {
    from?: string;
    to?: string;
}): Promise<ReportSummary> {
    const response = await client.get<{ data: ReportSummary }>('/reports/summary', { params });

    return response.data.data;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
    const response = await client.get<{ data: DeliveryZone[] }>('/delivery-zones');

    return response.data.data;
}

export async function createDeliveryZone(payload: Record<string, unknown>): Promise<DeliveryZone> {
    const response = await client.post<{ data: DeliveryZone }>('/delivery-zones', payload);

    return response.data.data;
}

export async function updateDeliveryZone(
    id: number,
    payload: Record<string, unknown>,
): Promise<DeliveryZone> {
    const response = await client.put<{ data: DeliveryZone }>(`/delivery-zones/${id}`, payload);

    return response.data.data;
}

export async function deleteDeliveryZone(id: number): Promise<void> {
    await client.delete(`/delivery-zones/${id}`);
}

export async function createFeeRule(
    zoneId: number,
    payload: Record<string, unknown>,
): Promise<DeliveryFeeRule> {
    const response = await client.post<{ data: DeliveryFeeRule }>(
        `/delivery-zones/${zoneId}/fee-rules`,
        payload,
    );

    return response.data.data;
}

export async function deleteFeeRule(id: number): Promise<void> {
    await client.delete(`/delivery-fee-rules/${id}`);
}
