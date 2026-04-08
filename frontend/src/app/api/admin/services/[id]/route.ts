/**
 * /api/admin/services/[id]
 * PATCH  — update service or add-on (syncs Stripe Product name/price)
 * DELETE — deactivate service or add-on
 *
 * Query param: ?type=addon  (defaults to 'service')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

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

    // Look up existing stripe_product_id from DB (only services have it; add_ons do not)
    let stripeProductId: string | null = null;
    if (!isAddon) {
        const { data: existing } = await supabase.from(table).select('stripe_product_id').eq('id', id).single();
        stripeProductId = existing?.stripe_product_id as string | null;
    }

    if (stripeProductId) {
        try {
            const updates: Record<string, any> = {};
            if (fields.name) updates.name = fields.name;
            if (fields.description) updates.description = fields.description;
            if (typeof fields.is_active === 'boolean') updates.active = fields.is_active;

            if (Object.keys(updates).length > 0) {
                await stripe.products.update(stripeProductId, updates);
            }
            // Create a new Price if price changed (Stripe prices are immutable)
            if (fields[priceField]) {
                await stripe.prices.create({
                    product: stripeProductId,
                    unit_amount: Math.round(parseFloat(fields[priceField]) * 100),
                    currency: 'usd',
                });
            }
        } catch (err) {
            console.error('Stripe sync failed:', err);
            return NextResponse.json({ error: 'Failed to sync changes to Stripe.' }, { status: 502 });
        }
    }

    const updatePayload: Record<string, unknown> = {};
    // Only services table has updated_at column; add_ons does not
    if (!isAddon) updatePayload.updated_at = new Date().toISOString();
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
    const permanent = new URL(req.url).searchParams.get('permanent') === 'true';

    // Look up stripe_product_id before deleting so we can archive it in Stripe (only services have it)
    let stripeProductId: string | null = null;
    if (table === 'services') {
        const { data: existing } = await supabase.from(table).select('stripe_product_id').eq('id', id).single();
        stripeProductId = existing?.stripe_product_id as string | null;
    }

    if (permanent) {
        // Archive Stripe product (deactivate, not delete — Stripe doesn't allow product deletion with prices)
        if (stripeProductId) {
            try {
                await stripe.products.update(stripeProductId, { active: false });
            } catch (err) {
                console.error('Stripe product archive failed:', err);
            }
        }
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    }

    // Soft-delete: set is_active = false + archive in Stripe
    if (stripeProductId) {
        try {
            await stripe.products.update(stripeProductId, { active: false });
        } catch (err) {
            console.error('Stripe product archive failed:', err);
        }
    }
    // Only services table has updated_at column; add_ons does not
    const softDeletePayload: Record<string, unknown> = { is_active: false };
    if (table === 'services') softDeletePayload.updated_at = new Date().toISOString();
    const { error } = await supabase.from(table).update(softDeletePayload).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
