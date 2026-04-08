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

        // Only contractors (and admins) may access job details
        const { data: callerProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        const callerRole = (callerProfile as { role?: string } | null)?.role;
        if (callerRole !== 'contractor' && callerRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const safeId = String(id).trim();
        if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', safeId)
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

        // Look up service description by name
        let serviceDescription: string | null = null;
        let serviceDescriptionEs: string | null = null;
        if (data.service_name) {
            const { data: svc } = await supabase
                .from('services')
                .select('description, description_es')
                .eq('name', data.service_name)
                .maybeSingle();
            if (svc) {
                serviceDescription = svc.description ?? null;
                serviceDescriptionEs = svc.description_es ?? svc.description ?? null;
            }
        }

        // Normalize to the shape the job detail page expects
        // IMPORTANT: Do NOT spread `...data` — it would leak `total_amount` at 100%.
        // Contractors receive 70% (CONTRACTOR_SHARE).
        const CONTRACTOR_SHARE = 0.70;
        const normalized = {
            id: data.id,
            status: data.status,
            service_name: data.service_name,
            date: data.date,
            time_window: data.time_window,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            contractor_id: data.contractor_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            special_instructions: data.special_instructions,
            confirmation_code: data.confirmation_code,
            document_id: data.document_id,
            vehicle_make: data.vehicle_make,
            vehicle_model: data.vehicle_model,
            vehicle_year: data.vehicle_year,
            vehicle_color: data.vehicle_color,
            selected_add_ons: data.selected_add_ons ?? [],
            total_amount: data.total_amount != null ? data.total_amount * CONTRACTOR_SHARE : null,
            // Camel-case aliases consumed by the job page
            scheduled_date: data.date,
            timeWindow: data.time_window,
            specialInstructions: data.special_instructions,
            // Build service object from service_name text column
            service: data.service_name
                ? { name: data.service_name, name_es: data.service_name, description: serviceDescription, description_es: serviceDescriptionEs }
                : null,
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
