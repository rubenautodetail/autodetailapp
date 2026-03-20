/**
 * GET /api/contractors/jobs/[id]
 * Returns detailed info for a single booking by ID.
 * Response is normalized so the job page can access:
 *   job.service         — { name, name_es }
 *   job.scheduled_date  — alias for date
 *   job.timeWindow      — alias for time_window
 *   job.customer_name   — customer's name
 *   job.customer_phone  — customer's phone (revealed once job is active)
 *   job.location        — { address, zipCode }
 *   job.specialInstructions — alias for special_instructions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const safeId = String(id).trim();
        if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        // Join services so the page can display the service name (incl. Spanish)
        const { data, error } = await supabase
            .from('bookings')
            .select('*, services:service_id(name, name_es)')
            .or(`id.eq.${safeId},document_id.eq.${safeId}`)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify the booking belongs to this contractor (or is unassigned and pending)
        const isAssignedToContractor = data.contractor_id === user.id;
        const isUnassigned = data.status === 'pending_assignment' && !data.contractor_id;
        if (!isAssignedToContractor && !isUnassigned) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Normalize to the shape the job detail page expects
        const normalized = {
            ...data,
            // Camel-case aliases consumed by the job page
            scheduled_date: data.date,
            timeWindow: data.time_window,
            specialInstructions: data.special_instructions,
            // Nested service object (mirrors the loadJobByCode Supabase join)
            service: data.services ?? null,
            // Nested location object
            location: {
                address: data.address ?? null,
                city: data.city ?? null,
                state: data.state ?? null,
                zipCode: data.zip_code ?? null,
            },
        };

        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Job details API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
