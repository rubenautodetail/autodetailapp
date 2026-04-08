/**
 * POST /api/booking/calculate-price
 * Calculates the price for a service + add-ons + ZIP code.
 * Reads services and add-ons from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import { PriceCalculateSchema } from '@/lib/validation/booking';

type AddOn = {
  id: number;
  document_id: string | null;
  name: string;
  price: number;
  duration_minutes: number | null;
};

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

        const { serviceId, addOnIds = [], zipCode } = parsed.data;
        const safeServiceId = serviceId;

        const supabase = createApiClient();

        // Fetch the service
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', safeServiceId)
            .eq('is_active', true)
            .single();

        if (serviceError || !service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Fetch add-ons if any (only active ones)
        let addOns: AddOn[] = [];
        if (addOnIds.length > 0) {
            const { data: addOnsData } = await supabase
                .from('add_ons')
                .select('*')
                .in('document_id', addOnIds)
                .eq('is_active', true);
            addOns = (addOnsData as AddOn[]) || [];
        }

        const basePrice = Number(service.base_price);
        const addOnsTotal = addOns.reduce((sum, a) => sum + Number(a.price), 0);
        const subtotal = basePrice + addOnsTotal;
        const serviceFee = 0; // Service fee removed
        const total = Math.round(subtotal * 100) / 100;

        const totalDuration =
            (service.duration_minutes || 60) +
            addOns.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

        return NextResponse.json({
            service: {
                id: service.document_id || String(service.id),
                name: service.name,
                basePrice,
                adjustedPrice: basePrice,
            },
            addOns: addOns.map((a) => ({
                id: a.document_id || String(a.id),
                name: a.name,
                price: Number(a.price),
            })),
            zone: {
                zipCode: zipCode || '',
                multiplier: 1.0,
            },
            breakdown: {
                basePrice,
                addOnsTotal,
                subtotal,
                serviceFee,
                total,
            },
            totalDuration,
        });
    } catch (error) {
        console.error('Error in calculate-price:', error);
        return NextResponse.json(
            { error: 'An error occurred while calculating price' },
            { status: 500 }
        );
    }
}
