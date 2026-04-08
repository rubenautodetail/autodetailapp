/**
 * POST /api/booking/validate-zip
 * Validates a ZIP code against the configured service area and returns available services + add-ons.
 *
 * Configure service area via environment variable:
 *   SERVICE_ZIP_CODES=33186,33155,33143,33165,33175,33185,33184,33183,33126,33145
 *
 * If SERVICE_ZIP_CODES is not set, all valid 5-digit ZIPs are accepted (development mode).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

// Parse configured service ZIP codes from env
function getServiceZipCodes(): Set<string> | null {
    const raw = process.env.SERVICE_ZIP_CODES;
    if (!raw || !raw.trim()) return null; // null = dev mode, accept all

    const zips = raw.split(',').map((z) => z.trim()).filter((z) => /^\d{5}$/.test(z));
    return zips.length > 0 ? new Set(zips) : null;
}

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { zipCode } = body;

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

        // Check against configured service area
        const serviceZips = getServiceZipCodes();
        if (serviceZips && !serviceZips.has(cleanZip)) {
            return NextResponse.json({
                available: false,
                zipCode: cleanZip,
                message: 'We currently only service Miami-Dade County. Join our waitlist to be notified when we expand to your area!',
            });
        }

        const supabase = createApiClient();

        // Fetch active services from Supabase
        const { data: servicesData } = await supabase
            .from('services')
            .select('id, name, name_es, description, description_es, base_price, duration_minutes, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        // Fetch active add-ons from Supabase
        const { data: addOnsData } = await supabase
            .from('add_ons')
            .select('id, name, name_es, description, description_es, price, duration_minutes, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        // Map services to response shape (include bilingual fields)
        const services = (servicesData || []).map((s) => ({
            id: String(s.id),
            name: s.name,
            nameEs: s.name_es || s.name,
            description: s.description || '',
            descriptionEs: s.description_es || s.description || '',
            basePrice: Number(s.base_price),
            durationMinutes: s.duration_minutes || 60,
        }));

        // Map add-ons to response shape (include bilingual fields)
        const addOns = (addOnsData || []).map((a) => ({
            id: String(a.id),
            name: a.name,
            nameEs: a.name_es || a.name,
            description: a.description || '',
            descriptionEs: a.description_es || a.description || '',
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
