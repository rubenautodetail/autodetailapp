'use client';

import Image from 'next/image';
import { useVehicleBodyStyleImages } from '@/contexts/VehicleBodyStyleImagesContext';
import { getVehicleBodyStyleLabel, type VehicleBodyStyle, type VehicleLocale } from '@/types/vehicle';
import { VehicleSilhouette } from './VehicleSilhouette';

interface VehicleBodyStyleArtworkProps {
    style: VehicleBodyStyle;
    locale?: VehicleLocale;
    className?: string;
}

export function VehicleBodyStyleArtwork({
    style,
    locale = 'en',
    className = '',
}: VehicleBodyStyleArtworkProps) {
    const artwork = useVehicleBodyStyleImages()[style];

    if (!artwork) {
        return <VehicleSilhouette style={style} locale={locale} className={className} />;
    }

    const fallbackAlt = locale === 'es'
        ? `Ilustración de vehículo ${getVehicleBodyStyleLabel(style, locale)}`
        : `${getVehicleBodyStyleLabel(style, locale)} vehicle illustration`;

    return (
        <span className={`relative block overflow-hidden ${className}`}>
            <Image
                src={artwork.imageUrl}
                alt={artwork.altText || fallbackAlt}
                fill
                sizes="160px"
                className="object-contain p-1.5"
            />
        </span>
    );
}
