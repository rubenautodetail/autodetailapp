import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

function decimalDollarsToCents(value: string | number): number {
    const normalized = String(value).trim();
    const match = normalized.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return 0;
    return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const [{ data: service, error: serviceError }, { data: prices, error: pricesError }] = await Promise.all([
        supabase.from('services').select('id, base_price').eq('id', id).single(),
        supabase
            .from('service_body_style_prices')
            .select('id, service_id, body_style, price_cents, currency, stripe_price_id, created_at, updated_at')
            .eq('service_id', id),
    ]);

    if (serviceError || !service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (pricesError) {
        console.error('body-style-prices GET failed:', pricesError);
        return NextResponse.json({ error: 'Failed to load body-style prices' }, { status: 500 });
    }

    return NextResponse.json({
        basePriceCents: decimalDollarsToCents(service.base_price),
        prices: prices ?? [],
    });
}
