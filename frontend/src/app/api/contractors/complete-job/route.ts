import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';

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
            if ((approvalCheck as any)?.approval_status !== 'approved') {
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

        const updateQuery = supabase
            .from('bookings')
            .update({
                status: 'pending_approval',
                updated_at: new Date().toISOString(),
                ...(checklist ? { completion_notes: checklist } : {}),
            })
            .eq('id', safeId);

        // Only enforce contractor_id check when using JWT auth
        const { data: updatedBooking, error } = contractorId
            ? await updateQuery.eq('contractor_id', contractorId).select().single()
            : await updateQuery.select().single();

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
            const { data: fullBooking } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', (updatedBooking as any).id)
                .single();

            if (fullBooking && !fullBooking.customer_email && (fullBooking as any).user_id) {
                const { data: authData } = await supabase.auth.admin.getUserById((fullBooking as any).user_id);
                if (authData?.user?.email) {
                    (fullBooking as any).customer_email = authData.user.email;
                }
            }

            const bookingForNotify = fullBooking || updatedBooking;
            const serviceName = (bookingForNotify as any).service_name || 'Detailing Service';
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'booking.pending_approval',
                booking: { ...bookingForNotify, service_name: serviceName },
            });

            await logBookingEvent({
                bookingId: String((updatedBooking as any).id),
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
