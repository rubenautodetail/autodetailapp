'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { VehicleBodyStyleImageMap } from '@/lib/hygraph';

const VehicleBodyStyleImagesContext = createContext<VehicleBodyStyleImageMap>({});

interface VehicleBodyStyleImagesProviderProps {
    children: ReactNode;
    images: VehicleBodyStyleImageMap;
}

export function VehicleBodyStyleImagesProvider({
    children,
    images,
}: VehicleBodyStyleImagesProviderProps) {
    return (
        <VehicleBodyStyleImagesContext.Provider value={images}>
            {children}
        </VehicleBodyStyleImagesContext.Provider>
    );
}

export function useVehicleBodyStyleImages(): VehicleBodyStyleImageMap {
    return useContext(VehicleBodyStyleImagesContext);
}
