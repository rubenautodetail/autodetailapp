import type { Service } from '@/contexts/BookingContext';
import {
    canPreviewServicePrice,
    fetchServicePricePreviews,
    getServicePricePreviewKey,
} from '@/lib/pricing/servicePricePreviews';

const services: Service[] = [
    {
        id: 4,
        catalogId: 4,
        documentId: '4',
        name: 'EXPRESS DETAIL',
        description: 'Express service',
        basePrice: 75,
        duration: 80,
    },
    {
        id: 1,
        catalogId: 1,
        documentId: '1',
        name: 'INTERIOR DETAIL',
        description: 'Interior service',
        basePrice: 160,
        duration: 180,
    },
];

describe('service price previews', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('uses the catalog id as the stable preview key', () => {
        expect(getServicePricePreviewKey({ id: 'legacy', catalogId: 4 })).toBe('4');
    });

    it('returns body-style overrides and inherited base prices per service', async () => {
        const fetchMock = jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify({
                vehicles: [{ priceSource: 'override', servicePrice: 60 }],
            }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                vehicles: [{ priceSource: 'base', servicePrice: 160 }],
            }), { status: 200 }));

        const result = await fetchServicePricePreviews(services, [{ bodyStyle: 'coupe' }]);

        expect(result['4']).toEqual({ servicePrice: 60, priceSource: 'override', vehicleCount: 1 });
        expect(result['1']).toEqual({ servicePrice: 160, priceSource: 'base', vehicleCount: 1 });
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
            serviceId: 4,
            vehicles: [{ bodyStyle: 'coupe' }],
        });
    });

    it('sums multi-vehicle service prices and marks mixed sources', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            vehicles: [
                { priceSource: 'override', servicePrice: 60 },
                { priceSource: 'base', servicePrice: 75 },
            ],
        }), { status: 200 }));

        const result = await fetchServicePricePreviews([services[0]], [
            { bodyStyle: 'coupe' },
            { bodyStyle: 'other' },
        ]);

        expect(result['4']).toEqual({ servicePrice: 135, priceSource: 'mixed', vehicleCount: 2 });
    });
});

describe('canPreviewServicePrice', () => {
    it('accepts a service with an explicit catalog id', () => {
        expect(canPreviewServicePrice({ id: 'abc', catalogId: 12 })).toBe(true);
    });

    it('accepts a service whose own id is numeric', () => {
        expect(canPreviewServicePrice({ id: 4, catalogId: undefined })).toBe(true);
    });

    it('rejects a service the pricing endpoint can never be asked about', () => {
        // These are skipped by fetchServicePricePreviews, so the UI must not
        // count them as failed price lookups.
        expect(canPreviewServicePrice({ id: 'string-only', catalogId: undefined })).toBe(false);
    });
});
