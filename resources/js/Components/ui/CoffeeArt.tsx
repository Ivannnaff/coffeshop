import { useId } from 'react';
import { cn } from '@/lib/cn';

const papers = ['#EFE6D3', '#EFE7DA', '#EDE6D2', '#F0E8DC'];

function paperFor(seed: string): string {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }

    return papers[hash % papers.length];
}

interface CoffeeArtProps {
    seed: string;
    className?: string;
    compact?: boolean;
}

/**
 * Ilustrasi cangkir garis hijau di atas kertas, mengikuti gaya garis logo.
 * Tanpa gradien atau glow supaya tetap terasa seperti cetakan nota.
 */
export function CoffeeArt({ seed, className, compact }: CoffeeArtProps) {
    const paper = paperFor(seed);
    const id = useId().replace(/[:]/g, '');
    const clipId = `coffee-clip-${id}`;

    return (
        <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid slice"
            className={cn('h-full w-full', className)}
            aria-hidden="true"
            role="presentation"
        >
            <defs>
                <clipPath id={clipId}>
                    <rect width="200" height="200" />
                </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
                <rect width="200" height="200" fill={paper} />
                <circle
                    cx="100"
                    cy="100"
                    r="74"
                    fill="none"
                    stroke="#1B4A32"
                    strokeWidth="1"
                    opacity="0.16"
                />

                <ellipse cx="100" cy="154" rx="46" ry="8" fill="#1B4A32" opacity="0.08" />

                <path
                    d="M139 94 q19 2 16 20 q-3 16 -20 16"
                    fill="none"
                    stroke="#1B4A32"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                />
                <path
                    d="M62 90 h76 l-6 44 q-2 14 -18 14 h-26 q-16 0 -18 -14 Z"
                    fill="#FFFCF5"
                    stroke="#1B4A32"
                    strokeWidth="3.4"
                    strokeLinejoin="round"
                />
                <ellipse
                    cx="100"
                    cy="90"
                    rx="38"
                    ry="8.5"
                    fill="#FFFCF5"
                    stroke="#1B4A32"
                    strokeWidth="3.4"
                />
                <path
                    d="M74 90 q12 -6 26 0 q12 5 26 0"
                    fill="none"
                    stroke="#1B4A32"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.45"
                />

                <g fill="none" stroke="#1B4A32" strokeWidth="3" strokeLinecap="round" opacity="0.7">
                    <path d="M86 62 q-7 11 0 20" />
                    <path d="M108 58 q-7 12 0 22" />
                </g>

                {!compact && (
                    <g fill="#1B4A32" opacity="0.28">
                        <ellipse cx="38" cy="52" rx="8" ry="4.6" transform="rotate(-28 38 52)" />
                        <ellipse cx="160" cy="62" rx="7" ry="4" transform="rotate(24 160 62)" />
                        <ellipse
                            cx="150"
                            cy="136"
                            rx="6"
                            ry="3.6"
                            transform="rotate(-18 150 136)"
                        />
                    </g>
                )}
            </g>
        </svg>
    );
}
