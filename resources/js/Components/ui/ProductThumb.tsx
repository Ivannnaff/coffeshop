import { useState } from 'react';
import { CoffeeArt } from '@/Components/ui/CoffeeArt';
import { resolveProductImageByName } from '@/lib/menu/product';
import { cn } from '@/lib/cn';

interface ProductThumbProps {
    name: string;
    size?: number;
    dark?: boolean;
}

export function ProductThumb({ name, size = 48, dark = false }: ProductThumbProps) {
    const [failed, setFailed] = useState(false);
    const url = resolveProductImageByName(name);

    return (
        <span
            className={cn(
                'rounded-media block shrink-0 overflow-hidden',
                dark ? 'bg-espresso-soft' : 'bg-canvas-deep',
            )}
            style={{ width: size, height: size }}
        >
            {url && !failed ? (
                <img
                    src={url}
                    alt=""
                    width={size}
                    height={size}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <CoffeeArt seed={name} compact />
            )}
        </span>
    );
}
