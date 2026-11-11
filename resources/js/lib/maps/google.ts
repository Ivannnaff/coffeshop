const SCRIPT_ID = 'google-maps-script';
const CALLBACK_NAME = '__menantiInitGoogleMaps';

let loaderPromise: Promise<void> | null = null;

export function getMapsApiKey(): string | undefined {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    return key && key.trim() !== '' ? key.trim() : undefined;
}

export function loadGoogleMaps(): Promise<void> {
    const key = getMapsApiKey();

    if (!key) {
        return Promise.reject(new Error('MAPS_KEY_MISSING'));
    }

    if (typeof google !== 'undefined' && google.maps) {
        return Promise.resolve();
    }

    if (loaderPromise) {
        return loaderPromise;
    }

    loaderPromise = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            return;
        }

        const callback = `${CALLBACK_NAME}_${Date.now()}`;
        (window as unknown as Record<string, unknown>)[callback] = () => {
            resolve();
        };

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=${callback}`;
        script.onerror = () => {
            loaderPromise = null;
            reject(new Error('MAPS_LOAD_FAILED'));
        };
        document.head.appendChild(script);
    });

    return loaderPromise;
}
