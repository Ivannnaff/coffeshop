export function formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function formatClock(value: string | null | undefined): string {
    if (!value) return '';

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function formatHours(opening: string | null | undefined, closing: string | null | undefined): string {
    if (!opening || !closing) return '';

    return `${opening.slice(0, 5)} - ${closing.slice(0, 5)}`;
}
