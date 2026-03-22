import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        const supabase = createServiceClient();

        let bookingId: string;
        let safeId: string;
        let checklist: string | undefined;
        let contractorId: string | undefined;

        if (contentType.includes('application/json')) {
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
                .or(`id.eq.${safeId},document_id.eq.${safeId}`)
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
        } else {
            // JWT-based access (authenticated contractor)
            const authHeader = req.headers.get('Authorization');
            const token = authHeader?.replace('Bearer ', '').trim();

            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

            const formData = await req.formData();
            bookingId = formData.get('bookingId') as string;
            checklist = formData.get('checklist') as string;
            safeId = String(bookingId).trim();
            if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            contractorId = user.id;
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
            .or(`id.eq.${safeId},document_id.eq.${safeId}`);

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
                .or(`id.eq.${(updatedBooking as any).id},document_id.eq.${(updatedBooking as any).id}`)
                .single();

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
