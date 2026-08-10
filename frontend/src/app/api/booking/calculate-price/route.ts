/**
 * POST /api/booking/calculate-price
 * Calculates the price for a service + add-ons + ZIP code.
 * Reads services and add-ons from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PriceCalculateSchema } from '@/lib/validation/booking';
import {
    centsToDollars,
    PricingInputError,
    resolveBookingPrice,
} from '@/lib/pricing';

export async function POST(req: NextRequest) {
    try {
        let rawBody;
        try {
            rawBody = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const parsed = PriceCalculateSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { serviceId, serviceName, addOnIds = [], zipCode, bodyStyle, vehicles } = parsed.data;
        const quote = await resolveBookingPrice({
            serviceId,
            serviceName,
            addOnIds,
            vehicles: vehicles ?? [{ bodyStyle: bodyStyle ?? 'other' }],
        });

        const basePrice = centsToDollars(quote.service.basePriceCents);
        const addOnsTotal = centsToDollars(
            quote.addOns.reduce((sum, addOn) => sum + addOn.priceCents, 0)
        );
        const subtotal = centsToDollars(quote.subtotalCents);
        const total = centsToDollars(quote.totalCents);

        return NextResponse.json({
            service: {
                id: quote.service.id,
                documentId: quote.service.documentId,
                name: quote.service.name,
                basePrice,
                basePriceCents: quote.service.basePriceCents,
                adjustedPrice: centsToDollars(quote.vehicles[0].servicePriceCents),
            },
            addOns: quote.addOns.map((addOn) => ({
                id: addOn.id,
                documentId: addOn.documentId,
                name: addOn.name,
                price: centsToDollars(addOn.priceCents),
                priceCents: addOn.priceCents,
            })),
            vehicles: quote.vehicles.map((vehicle) => ({
                ...vehicle,
                servicePrice: centsToDollars(vehicle.servicePriceCents),
                addOnsPrice: centsToDollars(vehicle.addOnsPriceCents),
                total: centsToDollars(vehicle.totalCents),
            })),
            zone: {
                zipCode: zipCode || '',
                multiplier: 1.0,
            },
            breakdown: {
                basePrice,
                addOnsTotal,
                subtotal,
                subtotalCents: quote.subtotalCents,
                serviceFee: 0,
                serviceFeeCents: 0,
                total,
                totalCents: quote.totalCents,
            },
            subtotal,
            serviceFee: 0,
            total,
            currency: quote.currency,
            pricingRevision: quote.pricingRevision,
            totalDuration: quote.totalDurationMinutes,
        });
    } catch (error) {
        if (error instanceof PricingInputError) {
            const status = error.code === 'SERVICE_NOT_FOUND' ? 404 : 400;
            return NextResponse.json({ error: error.message }, { status });
        }
        console.error('Error in calculate-price:', error);
        return NextResponse.json(
            { error: 'An error occurred while calculating price' },
            { status: 500 }
        );
    }
}
