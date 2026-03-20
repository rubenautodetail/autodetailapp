/**
 * GET /api/services/available
 * Public endpoint — returns active services + add-ons for the booking tracking page.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createServiceClient();

        const [{ data: services }, { data: addOns }] = await Promise.all([
            supabase
                .from('services')
                .select('id, name, name_es, description, description_es, base_price, duration_minutes')
                .eq('is_active', true)
                .order('sort_order', { ascending: true }),
            supabase
                .from('add_ons')
                .select('id, name, name_es, description, description_es, price, duration_minutes')
                .eq('is_active', true)
                .order('sort_order', { ascending: true }),
        ]);

        return NextResponse.json({ services: services ?? [], addOns: addOns ?? [] });
    } catch (error) {
        console.error('Services available error:', error);
        return NextResponse.json({ services: [], addOns: [] }, { status: 500 });
    }
}
