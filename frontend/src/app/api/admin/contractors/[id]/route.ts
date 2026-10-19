import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/contractors/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const supabase = createServiceClient();

        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select(
                'id, full_name, email, phone, bio, profile_photo_url, service_area_zips, availability, is_available, languages, rating, total_ratings, total_jobs_completed, stripe_account_id, onboarding_complete, role, created_at'
            )
            .eq('id', id)
            .single();

        if (dbError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (err) {
        console.error('GET /api/admin/contractors/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/contractors/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let body: {
        availability?: { days: string[]; start_hour: number; end_hour: number };
        is_available?: boolean;
        full_name?: string;
        phone?: string;
        address?: string;
        business_name?: string;
        service_area_zips?: string[];
        zelle_contact?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.availability !== undefined) {
        const { days, start_hour, end_hour } = body.availability;
        // Basic validation
        if (!Array.isArray(days) || typeof start_hour !== 'number' || typeof end_hour !== 'number') {
            return NextResponse.json({ error: 'Invalid availability payload' }, { status: 400 });
        }
        updates.availability = { days, start_hour, end_hour };
    }

    if (body.is_available !== undefined) {
        updates.is_available = Boolean(body.is_available);
    }

    // ── Basic contact / business fields (admin edit) ──
    if (body.full_name !== undefined) {
        const v = String(body.full_name).trim();
        if (v.length < 2 || v.length > 100) {
            return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 });
        }
        updates.full_name = v;
    }
    if (body.phone !== undefined) {
        const v = String(body.phone).trim();
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11 || v.length > 20) {
            return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
        }
        // The phone lives in two columns; different screens read different ones.
        updates.phone = v;
        updates.phone_number = v;
    }
    if (body.address !== undefined) {
        const v = String(body.address).trim();
        if (v.length > 200) {
            return NextResponse.json({ error: 'Address is too long' }, { status: 400 });
        }
        updates.address = v || null;
    }
    if (body.business_name !== undefined) {
        const v = String(body.business_name).trim();
        if (v.length > 100) {
            return NextResponse.json({ error: 'Business name is too long' }, { status: 400 });
        }
        updates.business_name = v || null;
    }
    if (body.service_area_zips !== undefined) {
        if (!Array.isArray(body.service_area_zips)) {
            return NextResponse.json({ error: 'Invalid ZIP codes' }, { status: 400 });
        }
        const zips = [...new Set(body.service_area_zips.map((z) => String(z).trim()).filter(Boolean))];
        if (zips.length === 0 || zips.some((z) => !/^\d{5}$/.test(z))) {
            return NextResponse.json({ error: 'ZIP codes must be 5 digits' }, { status: 400 });
        }
        updates.service_area_zips = zips;
    }
    if (body.zelle_contact !== undefined) {
        const v = String(body.zelle_contact).trim();
        if (v.length > 100) {
            return NextResponse.json({ error: 'Zelle contact is too long' }, { status: 400 });
        }
        updates.zelle_contact = v || null;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    try {
        const supabase = createServiceClient();

        const { data: updated, error: dbError } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            console.error('Profile PATCH db error:', dbError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: updated });
    } catch (err) {
        console.error('PATCH /api/admin/contractors/[id] error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}