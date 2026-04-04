import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';

interface ApprovalCheck {
    approval_status: string | null;
}

interface BookingRow {
    id: string;
    user_id: string | null;
    contractor_id: string | null;
    status: string | null;
    payment_status: string | null;
    payment_intent_id: string | null;
    confirmation_code: string | null;
    total_amount: number | null;
    service_id: string | null;
    service_name: string | null;
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: string | null;
    vehicle_color: string | null;
    vehicle_type: string | null;
    date: string | null;
    time_window: string | null;
    special_instructions: string | null;
    locale: string | null;
    completion_notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    pending_approval_at: string | null;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createServiceClient();
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        let bookingId: string;
        let safeId: string;
        let checklist: string | undefined;
        let contractorId: string | undefined;

        if (token) {
            // JWT-based access (authenticated contractor)
            const { user, error: authError } = await createAuthClient(token);
            if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const { data: approvalCheck } = await supabase
                .from('profiles')
                .select('approval_status')
                .eq('id', user.id)
                .single();
            if ((approvalCheck as ApprovalCheck | null)?.approval_status !== 'approved') {
                return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
            }

            const body = await req.json();
            bookingId = body.bookingId;
            checklist = body.checklist;
            safeId = String(bookingId).trim();
            if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            contractorId = user.id;
        } else {
            // Code-based access — no JWT required
            const body = await req.json();
            bookingId = body.bookingId;
            checklist = body.checklist;
            const confirmationCode = body.confirmationCode;

            if (!bookingId || !confirmationCode) {
                return NextResponse.json({ error: 'bookingId and confirmationCode are required' }, { status: 400 });
            }

            safeId = String(bookingId).trim();
            if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }

            // Verify the code matches this booking
            const { data: booking, error } = await supabase
                .from('bookings')
                .select('id, contractor_id, status, confirmation_code')
                .eq('id', safeId)
                .single();

            if (error || !booking) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }

            if (booking.confirmation_code !== confirmationCode) {
                return NextResponse.json({ error: 'Invalid confirmation code' }, { status: 403 });
            }

            if (booking.status !== 'in_progress') {
                return NextResponse.json(
                    { error: `Cannot complete a job with status '${booking.status}'` },
                    { status: 409 }
                );
            }

            contractorId = booking.contractor_id;
        }

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        // For JWT-auth path: verify the booking exists, belongs to this contractor, and is in_progress
        if (contractorId) {
            const { data: existing } = await supabase
                .from('bookings')
                .select('id, contractor_id, status')
                .eq('id', safeId)
                .single();

            if (!existing) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }
            if (existing.contractor_id !== contractorId) {
                return NextResponse.json({ error: 'This job is not assigned to your account' }, { status: 403 });
            }
            if (existing.status !== 'in_progress') {
                return NextResponse.json(
                    { error: `Cannot complete a job with status '${existing.status}'` },
                    { status: 409 }
                );
            }
        }

        const nowIso = new Date().toISOString();
        const updateQuery = supabase
            .from('bookings')
            .update({
                status: 'pending_approval',
                updated_at: nowIso,
                pending_approval_at: nowIso,
                ...(checklist ? { completion_notes: checklist } : {}),
            })
            .eq('id', safeId);

        // Only enforce contractor_id check when using JWT auth.
        // Always include status check in WHERE to prevent TOCTOU race condition.
        const { data: updatedBooking, error } = contractorId
            ? await updateQuery.eq('status', 'in_progress').eq('contractor_id', contractorId).select().single()
            : await updateQuery.eq('status', 'in_progress').select().single();

        if (error) {
            console.error('Error completing job:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (updatedBooking) {
            // Re-fetch the full booking row so that customer_email and all
            // notification fields are available. The UPDATE .select() only returns
            // the columns present in the row, but an earlier code-path only selected
            // a subset (id, contractor_id, status, confirmation_code), so
            // updatedBooking may be missing customer_email, address, vehicle_*, etc.
            const updatedRow = updatedBooking as BookingRow;
            const { data: fullBooking } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', updatedRow.id)
                .single();

            const fullRow = fullBooking as BookingRow | null;
            if (fullRow && !fullRow.customer_email && fullRow.user_id) {
                const { data: authData } = await supabase.auth.admin.getUserById(fullRow.user_id);
                if (authData?.user?.email) {
                    fullRow.customer_email = authData.user.email;
                }
            }

            const bookingForNotify = fullRow || updatedRow;
            const serviceName = bookingForNotify.service_name || 'Detailing Service';
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'booking.pending_approval',
                booking: { ...bookingForNotify, service_name: serviceName },
            });

            await logBookingEvent({
                bookingId: String(updatedRow.id),
                fromStatus: 'in_progress',
                toStatus: 'pending_approval',
                actorId: contractorId,
                actorType: 'contractor',
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Complete-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
