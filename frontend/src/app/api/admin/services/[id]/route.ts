/**
 * /api/admin/services/[id]
 * PATCH  — update service or add-on (syncs Stripe Product name/price)
 * DELETE — deactivate service or add-on
 *
 * Query param: ?type=addon  (defaults to 'service')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) return false;

    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
    if (token === adminSecret) return true;
    if (!token) return false;

    try {
        const { user, error } = await createAuthClient(token);
        if (error || !user) return false;
        const supabase = createServiceClient();
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        return (profile as { role?: string } | null)?.role === 'admin';
    } catch { return false; }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { type, ...fields } = await req.json();
    const isAddon = type === 'addon';

    const supabase = createServiceClient();
    const table = isAddon ? 'add_ons' : 'services';
    const priceField = isAddon ? 'price' : 'base_price';

    // Sync Stripe Product if it exists
    if (fields.stripe_product_id && fields.name) {
        try {
            await stripe.products.update(fields.stripe_product_id, { name: fields.name });
            // Create a new Price if price changed (Stripe prices are immutable)
            if (fields[priceField]) {
                await stripe.prices.create({
                    product: fields.stripe_product_id,
                    unit_amount: Math.round(parseFloat(fields[priceField]) * 100),
                    currency: 'usd',
                });
            }
        } catch (err) {
            console.error('Stripe sync failed (non-fatal):', err);
        }
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = isAddon
        ? ['name', 'name_es', 'description', 'description_es', 'price', 'duration_minutes', 'is_active', 'sort_order']
        : ['name', 'name_es', 'description', 'description_es', 'base_price', 'duration_minutes', 'is_active', 'sort_order'];

    for (const f of allowedFields) {
        if (fields[f] !== undefined) updatePayload[f] = fields[f];
    }

    const { data, error } = await supabase.from(table).update(updatePayload).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const type = new URL(req.url).searchParams.get('type');
    const table = type === 'addon' ? 'add_ons' : 'services';

    const supabase = createServiceClient();
    // Soft-delete: set is_active = false
    const { error } = await supabase.from(table).update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
