import { usePage } from '@inertiajs/react';
import type { SharedPageProps, StoreInfo } from '@/types';

interface ResourceEnvelope {
    data?: StoreInfo;
}

export function useStore(): StoreInfo | null {
    const raw = usePage<SharedPageProps>().props.store as unknown;

    if (!raw || typeof raw !== 'object') return null;

    const envelope = raw as ResourceEnvelope;

    if ('data' in envelope && envelope.data && typeof envelope.data === 'object') {
        return envelope.data;
    }

    return raw as StoreInfo;
}
