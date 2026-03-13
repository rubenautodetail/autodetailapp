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
        const userId = user.id;

        const supabase = createServiceClient();

        // Require admin approval before a contractor can accept jobs
        const { data: approvalCheck } = await supabase
            .from('profiles')
            .select('approval_status')
            .eq('id', userId)
            .single();
        if ((approvalCheck as any)?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        // Look up the booking by `id` first, then fall back to `document_id`
        // so both UUID primary keys and string document_ids are accepted.
        const bookingQuery = supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .maybeSingle();

        const { data: initialBooking, error: fetchError } = await bookingQuery;
        let existingBooking = initialBooking;

        if (fetchError) {
            console.error('accept-job: error fetching booking by id:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!existingBooking) {
            // Try document_id as fallback
            const { data: bookingByDocId, error: docIdError } = await supabase
                .from('bookings')
                .select('*')
                .eq('document_id', bookingId)
                .maybeSingle();

            if (docIdError) {
                console.error('accept-job: error fetching booking by document_id:', docIdError);
                return NextResponse.json({ error: docIdError.message }, { status: 500 });
            }

            existingBooking = bookingByDocId;
        }

        if (!existingBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const contractorId = userId;

        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                contractor_id: contractorId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingBooking.id)
            .select()
            .single();

        if (updateError) {
            console.error('accept-job: error updating booking:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Send notification email to customer. Fetch contractor profile for the email.
        let contractorData: any = null;

        if (contractorId) {
            const { data: contractorInfo } = await supabase
                .from('profiles')
                .select('full_name, phone_number')
                .eq('id', contractorId)
                .single();
            contractorData = contractorInfo;
        }

        if (updatedBooking) {
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'contractor.job_accepted',
                booking: updatedBooking,
                contractor: contractorData ?? {},
            });

            await logBookingEvent({
                bookingId: String(updatedBooking.id),
                fromStatus: existingBooking.status,
                toStatus: 'confirmed',
                actorId: contractorId ?? undefined,
                actorType: 'contractor',
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('accept-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
