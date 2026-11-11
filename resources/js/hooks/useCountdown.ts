import { useEffect, useMemo, useState } from 'react';

/**
 * Menghitung sisa waktu berdasarkan `expires_at` dari server. Jika `serverTime`
 * tersedia, selisih jam perangkat dengan server dikoreksi sekali saat mount.
 */
export function useCountdown(expiresAt: string | null, serverTime?: string | null) {
    const deadline = useMemo(() => {
        if (!expiresAt) return null;

        const offset = serverTime ? new Date(serverTime).getTime() - Date.now() : 0;

        return new Date(expiresAt).getTime() - offset;
    }, [expiresAt, serverTime]);

    const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
        deadline === null ? 0 : Math.max(0, Math.floor((deadline - Date.now()) / 1000)),
    );

    useEffect(() => {
        if (deadline === null) return;

        const update = () => {
            setRemainingSeconds(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
        };

        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [deadline]);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
        remainingSeconds,
        formatted,
        isExpired: remainingSeconds <= 0,
        isWarning: remainingSeconds > 0 && remainingSeconds <= 180,
    };
}
