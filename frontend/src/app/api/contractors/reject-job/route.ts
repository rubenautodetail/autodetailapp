import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        // Require a valid contractor session
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
        }
        const actorId = user.id;

        const supabase = createServiceClient();

        // Look up the booking by `id` first, then fall back to `document_id`.
        const { data: initialBooking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .maybeSingle();
        let existingBooking = initialBooking;

        if (fetchError) {
            console.error('reject-job: error fetching booking by id:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!existingBooking) {
            const { data: bookingByDocId, error: docIdError } = await supabase
                .from('bookings')
                .select('*')
                .eq('document_id', bookingId)
                .maybeSingle();

            if (docIdError) {
                console.error('reject-job: error fetching booking by document_id:', docIdError);
                return NextResponse.json({ error: docIdError.message }, { status: 500 });
            }

            existingBooking = bookingByDocId;
        }

        if (!existingBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // A contractor rejecting a job means the job goes back into the assignment
        // queue — it is NOT cancelled. We clear the contractor assignment so the
        // auto-assignment logic can pick it up again (or an admin can re-assign).
        // We deliberately do NOT cancel the Stripe payment intent here because the
        // customer's booking is still valid; only the contractor assignment changed.
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'pending_assignment',
                contractor_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingBooking.id)
            .select()
            .single();

        if (updateError) {
            console.error('reject-job: error updating booking:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Notify admin that the job was rejected so it can be re-assigned.
        if (updatedBooking) {
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'contractor.job_rejected',
                booking: updatedBooking,
            });

            await logBookingEvent({
                bookingId: String(updatedBooking.id),
                fromStatus: existingBooking.status,
                toStatus: 'pending_assignment',
                actorId,
                actorType: 'contractor',
                notes: 'contractor skipped',
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('reject-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
