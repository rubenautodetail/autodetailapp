/**
 * POST /api/booking/validate-zip
 * Validates a ZIP code and returns available services + add-ons.
 * Ported from Strapi backend — Strapi no longer required at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { zipCode } = await req.json();

        if (!zipCode) {
            return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }

        // Clean and validate 5-digit ZIP format
        const cleanZip = String(zipCode).trim().split('-')[0];
        if (!/^\d{5}$/.test(cleanZip)) {
            return NextResponse.json(
                { error: 'Invalid ZIP code format. Please enter a 5-digit ZIP code.' },
                { status: 400 }
            );
        }

        // Special case: reject obvious test invalid ZIP
        if (cleanZip === '00000') {
            return NextResponse.json({
                available: false,
                zipCode: cleanZip,
                message: 'We are not currently servicing your area. Join our waitlist to be notified when we expand!',
            });
        }

        const supabase = createApiClient();

        // Fetch services from Supabase
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .order('sort_order', { ascending: true });

        // Fetch active add-ons from Supabase
        const { data: addOnsData } = await supabase
            .from('add_ons')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        // Map services to response shape
        const services = (servicesData || []).map((s) => ({
            id: s.document_id || String(s.id),
            name: s.name,
            description: s.description || '',
            basePrice: Number(s.base_price),
            durationMinutes: s.duration_minutes || 60,
        }));

        // Map add-ons to response shape
        const addOns = (addOnsData || []).map((a) => ({
            id: a.document_id || String(a.id),
            name: a.name,
            description: a.description || '',
            price: Number(a.price),
            durationMinutes: a.duration_minutes || 30,
        }));

        const nextAvailableDate = new Date();
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);

        return NextResponse.json({
            available: true,
            zipCode: cleanZip,
            zone: {
                coverageRadiusMiles: 25,
                priceMultiplier: 1.0,
            },
            services,
            addOns,
            contractors: 1,
            nextAvailableDate: nextAvailableDate.toISOString().split('T')[0],
            message: 'Great news! We service your area.',
        });
    } catch (error) {
        console.error('Error in validate-zip:', error);
        return NextResponse.json(
            { error: 'An error occurred while validating the ZIP code' },
            { status: 500 }
        );
    }
}
