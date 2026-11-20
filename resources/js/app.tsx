import './bootstrap';
import type { ComponentType } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { CartProvider } from '@/Context/CartContext';
import { ToastProvider } from '@/Context/ToastContext';
import type { Cart } from '@/types';

const configuredName = import.meta.env.VITE_APP_NAME;
const appName = configuredName && !configuredName.includes('${') ? configuredName : 'Menanti Pagi';

createInertiaApp({
    title: (title) => `${title ? `${title} | ` : ''}${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent<{ default: ComponentType }>(
            `./Pages/${name}.tsx`,
            import.meta.glob<{ default: ComponentType }>('./Pages/**/*.tsx'),
        );

        return page.default;
    },
    setup({ el, App, props }) {
        const initialCart = ((props.initialPage.props as { cart?: Cart | null }).cart ??
            null) as Cart | null;

        const root = createRoot(el);
        root.render(
            <ToastProvider>
                <CartProvider initialCart={initialCart}>
                    <App {...props} />
                </CartProvider>
            </ToastProvider>,
        );
    },
    progress: {
        color: '#B35A22',
    },
});
