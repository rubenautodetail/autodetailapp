/**
 * Custom hook for managing service selection and data fetching
 */

import { useState, useEffect } from 'react';
import { Service, AddOn } from '@/contexts';
import { fetchServices, fetchAddOns, StrapiService, StrapiAddOn } from '@/lib/api/strapi';

// Map Strapi service to BookingContext Service
// Map Strapi service to BookingContext Service
function mapStrapiService(s: StrapiService): Service {
    return {
        id: s.id,
        documentId: s.documentId,
        strapiId: s.id,
        name: s.name,  // Already localized from Strapi
        description: s.description,  // Already localized from Strapi
        basePrice: s.basePrice,
        duration: s.durationMinutes,
    };
}

// Map Strapi add-on to BookingContext AddOn
function mapStrapiAddOn(a: StrapiAddOn): AddOn {
    return {
        id: a.id,
        documentId: a.documentId,
        strapiId: a.id,
        name: a.name,  // Already localized from Strapi
        description: a.description,  // Already localized from Strapi
        price: a.price,
    };
}

// Fallback mock data (used only when Strapi is completely down)
const FALLBACK_SERVICES: Service[] = [
    {
        id: 'interior',
        documentId: 'interior_doc_id',
        name: 'Interior Detail',
        description: 'Deep clean of interior surfaces, seats, carpets, and dashboard',
        basePrice: 89.99,
        duration: 120,
    },
    {
        id: 'exterior',
        documentId: 'exterior_doc_id',
        name: 'Exterior Detail',
        description: 'Complete exterior wash, wax, tire shine, and window cleaning',
        basePrice: 79.99,
        duration: 90,
    },
    {
        id: 'full-detail',
        documentId: 'full_detail_doc_id',
        name: 'Full Detail Package',
        description: 'Complete interior and exterior detailing package - best value!',
        basePrice: 149.99,
        duration: 180,
    },
];

const FALLBACK_ADDONS: AddOn[] = [
    {
        id: 'premium-wax',
        documentId: 'premium_wax_doc_id',
        name: 'Premium Wax',
        price: 29.99,
        description: 'High-grade carnauba wax for long-lasting shine',
    },
    {
        id: 'tire-shine',
        documentId: 'tire_shine_doc_id',
        name: 'Tire Shine & Dressing',
        price: 15.99,
        description: 'Professional tire dressing for a deep black shine',
    },
    {
        id: 'pet-hair',
        documentId: 'pet_hair_doc_id',
        name: 'Pet Hair Removal',
        price: 24.99,
        description: 'Thorough removal of pet hair from all surfaces',
    },
    {
        id: 'headlight-restoration',
        documentId: 'headlight_doc_id',
        name: 'Headlight Restoration',
        price: 39.99,
        description: 'Restore clarity to foggy or yellowed headlights',
    },
];

interface UseServicesReturn {
    services: Service[];
    addOns: AddOn[];
    isLoading: boolean;
    error: Error | null;
}

export function useServices(locale: 'en' | 'es'): UseServicesReturn {
    const [services, setServices] = useState<Service[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);

                const [strapiServices, strapiAddOns] = await Promise.all([
                    fetchServices(locale),
                    fetchAddOns(locale),
                ]);

                if (!isMounted) return;

                // Use Strapi data if available, otherwise fallback
                const mappedServices = strapiServices.length > 0
                    ? strapiServices.map(mapStrapiService)
                    : FALLBACK_SERVICES;

                const mappedAddOns = strapiAddOns.length > 0
                    ? strapiAddOns.map(mapStrapiAddOn)
                    : FALLBACK_ADDONS;

                setServices(mappedServices);
                setAddOns(mappedAddOns);
            } catch (err) {
                console.error('Failed to load services:', err);

                if (!isMounted) return;

                setError(err instanceof Error ? err : new Error('Failed to load services'));

                // Use fallback data on error
                setServices(FALLBACK_SERVICES);
                setAddOns(FALLBACK_ADDONS);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [locale]);

    return { services, addOns, isLoading, error };
}
