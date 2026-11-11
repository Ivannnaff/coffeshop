const BASE_URL = '/api/public';
const TIMEOUT_MS = 15_000;

export interface ApiErrorPayload {
    status: number;
    code: string;
    message: string;
    errors?: Record<string, string[]>;
    details?: unknown;
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly errors?: Record<string, string[]>;
    public readonly details?: unknown;

    constructor(payload: ApiErrorPayload) {
        super(payload.message);
        this.name = 'ApiError';
        this.status = payload.status;
        this.code = payload.code;
        this.errors = payload.errors;
        this.details = payload.details;
    }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
    signal?: AbortSignal;
}

async function requestRaw(
    method: Method,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort);

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });

        const text = await response.text();
        let json: Record<string, unknown> = {};
        if (text !== '') {
            try {
                json = JSON.parse(text) as Record<string, unknown>;
            } catch {
                json = {};
            }
        }

        if (!response.ok) {
            throw new ApiError({
                status: response.status,
                code: typeof json.code === 'string' ? json.code : 'UNEXPECTED_ERROR',
                message: typeof json.message === 'string' ? json.message : 'Permintaan gagal.',
                errors: (json.errors as Record<string, string[]> | undefined) ?? undefined,
                details: json.order ?? undefined,
            });
        }

        return json;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new ApiError({
                status: 0,
                code: 'TIMEOUT',
                message: 'Permintaan melebihi batas waktu.',
            });
        }

        throw new ApiError({
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Koneksi terputus. Periksa jaringan Anda.',
        });
    } finally {
        window.clearTimeout(timeout);
        options.signal?.removeEventListener('abort', onAbort);
    }
}

async function request<T>(
    method: Method,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
): Promise<T> {
    const json = await requestRaw(method, path, body, options);

    if (json.data !== undefined) {
        return json.data as T;
    }

    return json as T;
}

export const client = {
    get<T>(path: string, options?: RequestOptions): Promise<T> {
        return request<T>('GET', path, undefined, options);
    },
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('POST', path, body, options);
    },
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return request<T>('PATCH', path, body, options);
    },
    delete<T>(path: string, options?: RequestOptions): Promise<T> {
        return request<T>('DELETE', path, undefined, options);
    },
    raw(method: Method, path: string, body?: unknown, options?: RequestOptions) {
        return requestRaw(method, path, body, options);
    },
};
