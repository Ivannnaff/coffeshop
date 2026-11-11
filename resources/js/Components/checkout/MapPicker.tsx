import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { getMapsApiKey, loadGoogleMaps } from '@/lib/maps/google';

export interface Coords {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    value: Coords | null;
    onChange: (coords: Coords) => void;
    center?: Coords | null;
}

const DEFAULT_CENTER: Coords = { lat: -7.7956, lng: 110.3695 };

export function MapPicker({ value, onChange, center }: MapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>(
        getMapsApiKey() ? 'loading' : 'missing',
    );
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    useEffect(() => {
        if (!getMapsApiKey()) return;

        let active = true;
        loadGoogleMaps()
            .then(() => {
                if (active) setStatus('ready');
            })
            .catch(() => {
                if (active) setStatus('error');
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (status !== 'ready' || !containerRef.current || mapRef.current) return;

        const initial = value ?? center ?? DEFAULT_CENTER;
        const map = new google.maps.Map(containerRef.current, {
            center: initial,
            zoom: 16,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
        });
        const marker = new google.maps.Marker({
            map,
            position: value ?? undefined,
            draggable: true,
        });

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;
            marker.setPosition(event.latLng);
            onChangeRef.current({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        marker.addListener('dragend', () => {
            const position = marker.getPosition();
            if (position) {
                onChangeRef.current({ lat: position.lat(), lng: position.lng() });
            }
        });

        mapRef.current = map;
        markerRef.current = marker;
    }, [status, center, value]);

    useEffect(() => {
        if (!value || !mapRef.current || !markerRef.current) return;
        const point = new google.maps.LatLng(value.lat, value.lng);
        markerRef.current.setPosition(point);
        mapRef.current.panTo(point);
    }, [value?.lat, value?.lng]);

    const locate = () => {
        setGeoError(null);

        if (!navigator.geolocation) {
            setGeoError('Perangkat ini tidak mendukung penentuan lokasi.');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocating(false);
                onChangeRef.current({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                setLocating(false);
                setGeoError('Izin lokasi ditolak. Tentukan titik secara manual.');
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        );
    };

    return (
        <div className="flex flex-col gap-2">
            {status === 'ready' ? (
                <div
                    ref={containerRef}
                    role="application"
                    aria-label="Peta titik pengiriman"
                    className="h-64 w-full overflow-hidden rounded-xl border border-line bg-brand-soft"
                />
            ) : (
                <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 text-center">
                    <MapPin className="h-6 w-6 text-ink-muted" aria-hidden="true" />
                    <p className="text-sm text-ink-muted">
                        {status === 'missing'
                            ? 'Peta belum dikonfigurasi. Gunakan tombol lokasi saya untuk mengisi titik pengiriman.'
                            : status === 'error'
                              ? 'Peta gagal dimuat. Gunakan tombol lokasi saya untuk mengisi titik pengiriman.'
                              : 'Memuat peta...'}
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" size="sm" loading={locating} onClick={locate}>
                    <LocateFixed className="h-4 w-4" aria-hidden="true" />
                    Gunakan lokasi saya
                </Button>
                {value && (
                    <span className="tabular text-[13px] text-ink-muted">
                        {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
                    </span>
                )}
            </div>

            {geoError && <p className="text-[13px] text-danger">{geoError}</p>}
        </div>
    );
}
