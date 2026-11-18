import axios from 'axios';

export const api = axios.create({
    baseURL: '/api/public',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export interface CheckoutFailureOrder {
    order_number: string;
    public_token: string;
    status: string;
    total: number;
}

export interface ApiError {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
    status?: number;
    order?: CheckoutFailureOrder;
}

export function toApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data as
            | {
                  message?: string;
                  code?: string;
                  errors?: Record<string, string[]>;
                  order?: CheckoutFailureOrder;
              }
            | undefined;

        return {
            message: payload?.message ?? 'Tidak dapat menghubungi server. Coba lagi.',
            code: payload?.code,
            errors: payload?.errors,
            status: error.response?.status,
            order: payload?.order,
        };
    }

    return { message: 'Terjadi kesalahan tak terduga.' };
}

export function firstError(errors: ApiError['errors'], field: string): string | undefined {
    return errors?.[field]?.[0];
}
