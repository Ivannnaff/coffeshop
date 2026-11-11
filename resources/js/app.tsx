import './bootstrap';
import type { ComponentType } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Menanti Pagi';

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
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#1E5B3E',
    },
});
