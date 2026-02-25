/**
 * POST /api/booking/calculate-price
 * Calculates the price for a service + add-ons + ZIP code.
 * Reads services and add-ons from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { serviceId, addOnIds = [], zipCode } = await req.json();

        if (!serviceId) {
            return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
        }

        const supabase = createApiClient();

        // Fetch the service
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .or(`document_id.eq.${serviceId},id.eq.${serviceId}`)
            .single();

        if (serviceError || !service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Fetch add-ons if any
        let addOns: any[] = [];
        if (addOnIds.length > 0) {
            const { data: addOnsData } = await supabase
                .from('add_ons')
                .select('*')
                .in('document_id', addOnIds);
            addOns = addOnsData || [];
        }

        const basePrice = Number(service.base_price);
        const addOnsTotal = addOns.reduce((sum, a) => sum + Number(a.price), 0);
        const subtotal = basePrice + addOnsTotal;
        const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
        const total = Math.round((subtotal + serviceFee) * 100) / 100;

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
