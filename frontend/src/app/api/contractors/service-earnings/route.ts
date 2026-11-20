/**
 * GET /api/contractors/service-earnings
 * For each active service: what the technician earns per vehicle type.
 * Only the technician's pay is returned — never the customer price or the share.
 * Requires an approved contractor (or admin) session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { contractorAmount } from '@/lib/contractorPay';

export const dynamic = 'force-dynamic';

const BODY_STYLES = ['sedan', 'coupe', 'suv', 'large_suv', 'pickup', 'minivan', 'van', 'other'] as const;

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const supabase = createServiceClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, approval_status')
            .eq('id', user.id)
            .single();

        const allowed =
            profile?.role === 'admin' ||
            (profile?.role === 'contractor' && profile?.approval_status === 'approved');
        if (!allowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const [{ data: services }, { data: overrides }] = await Promise.all([
            supabase
                .from('services')
                .select('id, name, name_es, description, description_es, base_price, duration_minutes')
                .eq('is_active', true)
                .order('sort_order', { ascending: true }),
            supabase
                .from('service_body_style_prices')
                .select('service_id, body_style, price_cents'),
        ]);

        const result = (services ?? []).map((s) => {
            const base = Number(s.base_price) || 0;
            const own = (overrides ?? []).filter((o) => o.service_id === s.id);
            const byStyle = BODY_STYLES.map((style) => {
                const match = own.find((o) => o.body_style === style);
                const customerPrice = match ? Number(match.price_cents) / 100 : base;
                return { bodyStyle: style, earn: contractorAmount(customerPrice) };
            });
            return {
                id: s.id,
                name: s.name,
                nameEs: s.name_es ?? null,
                description: s.description ?? null,
                descriptionEs: s.description_es ?? null,
                durationMinutes: s.duration_minutes ?? null,
                earnings: byStyle,
            };
        });

        return NextResponse.json({ services: result });
    } catch (error) {
        console.error('service-earnings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
