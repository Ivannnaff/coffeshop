import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debounced;
}

export function greeting(date = new Date()): string {
    const hour = Number(
        new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false }).format(date),
    );

    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';

    return 'Selamat malam';
}

export function formatCountdown(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function formatAddons(addons: { name: string; qty?: number }[]): string {
    return addons
        .map((addon) => ((addon.qty ?? 1) > 1 ? `${addon.name} ×${addon.qty}` : addon.name))
        .join(', ');
}
