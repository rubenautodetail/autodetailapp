import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────────────

interface AvailabilityPayload {
    days: string[];
    start_hour: number;
    end_hour: number;
}

interface ProfilePatchBody {
    full_name?: string;
    phone?: string;
    bio?: string;
    service_area_zips?: string[];
    availability?: AvailabilityPayload;
    is_available?: boolean;
    languages?: string[];
}

// ── Helper ───────────────────────────────────────────────────────────────────

async function resolveUser(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) return { user: null, token: null };
    const { user, error } = await createAuthClient(token);
    if (error || !user) return { user: null, token: null };
    return { user, token };
}

// ── GET /api/contractors/profile ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const { user } = await resolveUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceClient();
        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select(
                'id, full_name, email, phone, bio, profile_photo_url, service_area_zips, availability, is_available, languages, rating, total_ratings, total_jobs_completed, stripe_account_id, onboarding_complete, role, created_at'
            )
            .eq('id', user.id)
            .single();

        if (dbError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (err) {
        console.error('GET /api/contractors/profile error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── PATCH /api/contractors/profile ───────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const { user } = await resolveUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: ProfilePatchBody;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // Build update object — only include fields explicitly sent
        const updates: Record<string, unknown> = {};

        if (body.full_name !== undefined) {
            updates.full_name = body.full_name.trim() || null;
        }
        if (body.phone !== undefined) {
            updates.phone = body.phone.trim() || null;
        }
        if (body.bio !== undefined) {
            updates.bio = body.bio.trim() || null;
        }
        if (body.service_area_zips !== undefined) {
            // Sanitise: strip whitespace from each ZIP, filter empties
            updates.service_area_zips = body.service_area_zips
                .map((z) => z.trim())
                .filter(Boolean);
        }
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
        if (body.languages !== undefined) {
            updates.languages = body.languages.filter(Boolean);
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data: updated, error: dbError } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('id', user.id)
            .select()
            .single();

        if (dbError) {
            console.error('Profile PATCH db error:', dbError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: updated });
    } catch (err) {
        console.error('PATCH /api/contractors/profile error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
