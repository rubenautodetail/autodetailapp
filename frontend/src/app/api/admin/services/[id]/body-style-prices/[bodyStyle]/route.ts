import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

const BODY_STYLES = ['sedan', 'coupe', 'suv', 'large_suv', 'pickup', 'minivan', 'van', 'other'] as const;
type BodyStyle = (typeof BODY_STYLES)[number];

interface SaveBody {
    priceCents: number;
    currency: 'usd';
    expectedUpdatedAt: string | null;
    operationId: string;
}

interface DeleteBody {
    expectedUpdatedAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBodyStyle(value: string): value is BodyStyle {
    return BODY_STYLES.some((style) => style === value);
}

function parseSaveBody(value: unknown): SaveBody | null {
    if (!isRecord(value)) return null;
    const expectedUpdatedAt = value.expectedUpdatedAt;
    if (
        !Number.isInteger(value.priceCents) ||
        Number(value.priceCents) <= 0 ||
        value.currency !== 'usd' ||
        typeof value.operationId !== 'string' ||
        !/^[a-zA-Z0-9_-]{8,100}$/.test(value.operationId) ||
        !(expectedUpdatedAt === null || typeof expectedUpdatedAt === 'string')
    ) {
        return null;
    }
    return {
        priceCents: Number(value.priceCents),
        currency: 'usd',
        expectedUpdatedAt,
        operationId: value.operationId,
    };
}

function parseDeleteBody(value: unknown): DeleteBody | null {
    if (!isRecord(value)) return null;
    const expectedUpdatedAt = value.expectedUpdatedAt;
    if (!(expectedUpdatedAt === null || typeof expectedUpdatedAt === 'string')) return null;
    return { expectedUpdatedAt };
}

function decimalDollarsToCents(value: string | number): number {
    const match = String(value).trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return 0;
    return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

async function archiveStripePrice(priceId: string | null): Promise<boolean> {
    if (!priceId) return false;
    try {
        await stripe.prices.update(priceId, { active: false });
        return false;
    } catch (error) {
        console.error('Failed to archive replaced body-style Stripe Price:', error);
        return true;
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; bodyStyle: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, bodyStyle: rawBodyStyle } = await params;
    if (!isBodyStyle(rawBodyStyle)) {
        return NextResponse.json({ error: 'Invalid body style' }, { status: 400 });
    }

    let body: SaveBody | null = null;
    try {
        body = parseSaveBody(await req.json());
    } catch {
        body = null;
    }
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const supabase = createServiceClient();
    const [serviceResult, existingResult] = await Promise.all([
        supabase
            .from('services')
            .select('id, name, base_price, stripe_product_id')
            .eq('id', id)
            .single(),
        supabase
            .from('service_body_style_prices')
            .select('id, price_cents, currency, stripe_price_id, updated_at')
            .eq('service_id', id)
            .eq('body_style', rawBodyStyle)
            .maybeSingle(),
    ]);
    const { data: service, error: serviceError } = serviceResult;
    const { data: existing, error: existingError } = existingResult;

    if (serviceError || !service) {
        return NextResponse.json({ error: serviceError ? 'Failed to load service' : 'Service not found' }, { status: serviceError ? 500 : 404 });
    }
    if (existingError) {
        return NextResponse.json({ error: 'Failed to load body-style price' }, { status: 500 });
    }
    if ((existing?.updated_at ?? null) !== body.expectedUpdatedAt) {
        return NextResponse.json({
            error: 'stale_edit',
            currentUpdatedAt: existing?.updated_at ?? null,
        }, { status: 409 });
    }
    if (existing && existing.price_cents === body.priceCents && existing.currency === body.currency) {
        return NextResponse.json({ data: existing, noop: true });
    }

    let stripeProductId = service.stripe_product_id;
    try {
        if (!stripeProductId) {
            const product = await stripe.products.create({
                name: service.name,
                metadata: { type: 'service', platform: 'dtailwash', service_id: String(service.id) },
            });
            const basePrice = await stripe.prices.create({
                product: product.id,
                unit_amount: decimalDollarsToCents(service.base_price),
                currency: 'usd',
                metadata: { type: 'service_base', service_id: String(service.id), platform: 'dtailwash' },
            });
            await stripe.products.update(product.id, { default_price: basePrice.id });
            stripeProductId = product.id;
            const { error: productPersistError } = await supabase
                .from('services')
                .update({ stripe_product_id: product.id })
                .eq('id', id);
            if (productPersistError) {
                throw new Error('Stripe product was created but could not be linked to the service');
            }
        }

        const operationId = body.operationId;
        const search = await stripe.prices.search({
            query: `metadata['operation_id']:'${operationId}'`,
            limit: 1,
        });
        const recoveredPrice = search.data.find((price) => {
            const productId = typeof price.product === 'string' ? price.product : price.product.id;
            return price.active
                && productId === stripeProductId
                && price.unit_amount === body.priceCents
                && price.currency === body.currency
                && price.metadata.service_id === String(service.id)
                && price.metadata.body_style === rawBodyStyle;
        });
        if (search.data.length > 0 && !recoveredPrice) {
            return NextResponse.json({ error: 'operation_id_conflict' }, { status: 409 });
        }
        const stripePrice = recoveredPrice ?? await stripe.prices.create({
            product: stripeProductId,
            unit_amount: body.priceCents,
            currency: body.currency,
            nickname: `${service.name} · ${rawBodyStyle}`,
            metadata: {
                type: 'service_body_style',
                service_id: String(service.id),
                body_style: rawBodyStyle,
                operation_id: operationId,
                platform: 'dtailwash',
            },
        }, { idempotencyKey: `bsp-${service.id}-${rawBodyStyle}-${operationId}` });

        const payload = {
            service_id: service.id,
            body_style: rawBodyStyle,
            price_cents: body.priceCents,
            currency: body.currency,
            stripe_price_id: stripePrice.id,
            updated_at: new Date().toISOString(),
        };

        const query = existing
            ? supabase
                .from('service_body_style_prices')
                .update(payload)
                .eq('id', existing.id)
                .eq('updated_at', existing.updated_at)
            : supabase.from('service_body_style_prices').insert(payload);
        const { data: saved, error } = await query.select().single();

        if (error || !saved) {
            console.error('Body-style price database save failed:', error);
            return NextResponse.json({ error: 'stale_edit' }, { status: 409 });
        }

        const archiveWarning = existing?.stripe_price_id && existing.stripe_price_id !== stripePrice.id
            ? await archiveStripePrice(existing.stripe_price_id)
            : false;
        return NextResponse.json({ data: saved, stripeArchiveWarning: archiveWarning }, { status: archiveWarning ? 207 : 200 });
    } catch (error) {
        console.error('Body-style Stripe sync failed:', error);
        return NextResponse.json({ error: 'Failed to sync body-style price to Stripe' }, { status: 502 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; bodyStyle: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, bodyStyle: rawBodyStyle } = await params;
    if (!isBodyStyle(rawBodyStyle)) {
        return NextResponse.json({ error: 'Invalid body style' }, { status: 400 });
    }

    let body: DeleteBody | null = null;
    try {
        body = parseDeleteBody(await req.json());
    } catch {
        body = null;
    }
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: existing } = await supabase
        .from('service_body_style_prices')
        .select('id, stripe_price_id, updated_at')
        .eq('service_id', id)
        .eq('body_style', rawBodyStyle)
        .maybeSingle();

    if (!existing) return NextResponse.json({ success: true, noop: true });
    if (existing.updated_at !== body.expectedUpdatedAt) {
        return NextResponse.json({ error: 'stale_edit', currentUpdatedAt: existing.updated_at }, { status: 409 });
    }

    const { error } = await supabase
        .from('service_body_style_prices')
        .delete()
        .eq('id', existing.id)
        .eq('updated_at', existing.updated_at);
    if (error) return NextResponse.json({ error: 'Failed to inherit base price' }, { status: 500 });

    const archiveWarning = await archiveStripePrice(existing.stripe_price_id);
    return NextResponse.json({ success: true, stripeArchiveWarning: archiveWarning }, { status: archiveWarning ? 207 : 200 });
}
