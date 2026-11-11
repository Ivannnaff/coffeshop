import { useEffect, useState } from 'react';
import { echo } from '@/lib/realtime/echo';
import { api } from '@/lib/api/endpoints';
import { Order } from '@/lib/api/types';

const POLL_INTERVAL_MS = 10_000;
const OFFLINE_AFTER_MS = 30_000;

export function useOrderStatus(initialOrder: Order) {
    const [order, setOrder] = useState<Order>(initialOrder);
    const [isOffline, setIsOffline] = useState(false);
    const token = initialOrder.public_token;
    const isFinal = order.status === 'COMPLETED' || order.status === 'EXPIRED';

    useEffect(() => {
        if (!token || isFinal) return;

        let offlineTimer: number | null = null;
        let active = true;

        const refetch = async () => {
            try {
                const latest = await api.getOrder(token);
                if (!active) return;
                setOrder(latest);
                setIsOffline(false);
                if (offlineTimer) {
                    window.clearTimeout(offlineTimer);
                    offlineTimer = null;
                }
            } catch {
                if (!offlineTimer) {
                    offlineTimer = window.setTimeout(() => {
                        if (active) setIsOffline(true);
                    }, OFFLINE_AFTER_MS);
                }
            }
        };

        const channel = echo.channel(`order.${token}`);
        channel.listen('.OrderStatusChanged', () => {
            void refetch();
        });

        const pollInterval = window.setInterval(() => {
            void refetch();
        }, POLL_INTERVAL_MS);

        return () => {
            active = false;
            echo.leave(`order.${token}`);
            window.clearInterval(pollInterval);
            if (offlineTimer) window.clearTimeout(offlineTimer);
        };
    }, [token, isFinal]);

    return { order, isOffline };
}
