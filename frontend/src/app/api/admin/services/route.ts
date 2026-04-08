/**
 * /api/admin/services
 * GET  — list all services + add-ons
 * POST — create a service or add-on (syncs Stripe Product automatically)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const [{ data: services }, { data: addOns }] = await Promise.all([
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('add_ons').select('*').order('sort_order', { ascending: true }),
    ]);

    return NextResponse.json({ services: services ?? [], addOns: addOns ?? [] });
}

export async function POST(req: NextRequest) {
    if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, ...fields } = body; // type: 'service' | 'addon'

    const supabase = createServiceClient();

    if (type === 'addon') {
        // Create Stripe Product + Price — fail the request if Stripe is unreachable
        try {
            const product = await stripe.products.create({
                name: fields.name,
                description: fields.description || undefined,
                metadata: { type: 'addon', platform: 'dtailwash' },
            });
            await stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(parseFloat(fields.price) * 100),
                currency: 'usd',
            });
        } catch (err) {
            console.error('Stripe product creation failed:', err);
            return NextResponse.json({ error: 'Failed to create Stripe product. Check Stripe credentials.' }, { status: 502 });
        }

        // Note: add_ons table does not have stripe_product_id or updated_at columns
        const { data, error } = await supabase.from('add_ons').insert({
            name: fields.name,
            name_es: fields.name_es || null,
            description: fields.description || null,
            description_es: fields.description_es || null,
            price: parseFloat(fields.price),
            duration_minutes: fields.duration_minutes ? parseInt(fields.duration_minutes) : null,
            is_active: true,
            sort_order: fields.sort_order || 99,
        }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    }

    // Validate required fields before calling Stripe
    if (!fields.name || typeof fields.name !== 'string' || !fields.name.trim()) {
        return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }
    if (fields.base_price == null || isNaN(parseFloat(fields.base_price)) || parseFloat(fields.base_price) <= 0) {
        return NextResponse.json({ error: 'A valid base_price is required' }, { status: 400 });
    }

    // Default: service — Create Stripe Product + Price first
    let stripeProductId: string;
    try {
        const product = await stripe.products.create({
            name: fields.name,
            description: fields.description || undefined,
            metadata: { type: 'service', platform: 'dtailwash' },
        });
        await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(parseFloat(fields.base_price) * 100),
            currency: 'usd',
        });
        stripeProductId = product.id;
    } catch (err) {
        console.error('Stripe product creation failed:', err);
        return NextResponse.json({ error: 'Failed to create Stripe product. Check Stripe credentials.' }, { status: 502 });
    }

    const { data, error } = await supabase.from('services').insert({
        name: fields.name,
        name_es: fields.name_es || null,
        description: fields.description || null,
        description_es: fields.description_es || null,
        base_price: parseFloat(fields.base_price),
        duration_minutes: fields.duration_minutes ? parseInt(fields.duration_minutes) : null,
        is_active: true,
        sort_order: fields.sort_order || 99,
        stripe_product_id: stripeProductId,
        slug: fields.name.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}
