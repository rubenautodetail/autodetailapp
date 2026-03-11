/**
 * /api/admin/services
 * GET  — list all services + add-ons
 * POST — create a service or add-on (syncs Stripe Product automatically)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const adminSecret = process.env.ADMIN_SECRET;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();

    if (adminSecret && token === adminSecret) return true;

    // Cookie-based session (admin browsing from UI)
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const db = createServiceClient();
            const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
            if ((p as { role?: string } | null)?.role === 'admin') return true;
        }
    } catch { /* fall through */ }

    if (!token) return false;

    try {
        const { user, error } = await createAuthClient(token);
        if (error || !user) return false;
        const db = createServiceClient();
        const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single();
        return (p as { role?: string } | null)?.role === 'admin';
    } catch { return false; }
}

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
        // Create Stripe Product for add-on
        let stripeProductId: string | null = null;
        try {
            const product = await stripe.products.create({
                name: fields.name,
                description: fields.description || undefined,
                metadata: { type: 'addon', platform: 'rubens-auto-detail' },
            });
            await stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(parseFloat(fields.price) * 100),
                currency: 'usd',
            });
            stripeProductId = product.id;
        } catch (err) {
            console.error('Stripe product creation failed (non-fatal):', err);
        }

        const { data, error } = await supabase.from('add_ons').insert({
            name: fields.name,
            name_es: fields.name_es || null,
            description: fields.description || null,
            description_es: fields.description_es || null,
            price: parseFloat(fields.price),
            duration_minutes: fields.duration_minutes ? parseInt(fields.duration_minutes) : null,
            is_active: true,
            sort_order: fields.sort_order || 99,
            stripe_product_id: stripeProductId,
        }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    }

    // Default: service
    let stripeProductId: string | null = null;
    try {
        const product = await stripe.products.create({
            name: fields.name,
            description: fields.description || undefined,
            metadata: { type: 'service', platform: 'rubens-auto-detail' },
        });
        await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(parseFloat(fields.base_price) * 100),
            currency: 'usd',
        });
        stripeProductId = product.id;
    } catch (err) {
        console.error('Stripe product creation failed (non-fatal):', err);
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
