export interface ProgressStep {
    step: number;
    label: string;
}

export function getProgressSteps(mode: string): ProgressStep[] {
    if (mode === 'delivery') {
        return [
            { step: 1, label: 'Menunggu pembayaran' },
            { step: 2, label: 'Dibayar' },
            { step: 3, label: 'Sedang dibuat' },
            { step: 4, label: 'Sedang diantar' },
            { step: 5, label: 'Selesai' },
        ];
    }

    return [
        { step: 1, label: 'Menunggu pembayaran' },
        { step: 2, label: 'Dibayar' },
        { step: 3, label: 'Sedang dibuat' },
        { step: 4, label: 'Siap diambil' },
        { step: 5, label: 'Selesai' },
    ];
}

export function getCurrentStep(status: string, mode: string): number {
    switch (status) {
        case 'PENDING_PAYMENT':
            return 1;
        case 'PAID':
            return 2;
        case 'PREPARING':
            return 3;
        case 'READY':
            return 4;
        case 'OUT_FOR_DELIVERY':
            return mode === 'delivery' ? 4 : 0;
        case 'COMPLETED':
            return 5;
        default:
            return 0;
    }
}

