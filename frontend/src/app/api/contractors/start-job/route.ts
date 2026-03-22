import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';
import { notify } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        const supabase = createServiceClient();

        let bookingId: string;
        let safeId: string;
        let contractorId: string | undefined;

        if (contentType.includes('application/json')) {
            // Code-based access — no JWT required, secured by confirmationCode
            const body = await req.json();
            bookingId = body.bookingId;
            const confirmationCode = body.confirmationCode;

            if (!bookingId || !confirmationCode) {
                return NextResponse.json(
                    { error: 'bookingId and confirmationCode are required' },
                    { status: 400 }
                );
            }

            safeId = String(bookingId).trim();
            if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }

            // Verify the code matches this booking before allowing the transition
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

            if (booking.status !== 'confirmed' && booking.status !== 'en_route') {
                return NextResponse.json(
                    { error: `Cannot start a job with status '${booking.status}'` },
                    { status: 409 }
                );
            }

            contractorId = booking.contractor_id ?? undefined;
        } else {
            // JWT-based access (authenticated contractor)
            const authHeader = req.headers.get('Authorization');
            const token = authHeader?.replace('Bearer ', '').trim();

            if (!token) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const { user, error: authError } = await createAuthClient(token);
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

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
            safeId = String(bookingId).trim();
            if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
                return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
            }
            contractorId = user.id;
        }

        const updateQuery = supabase
            .from('bookings')
            .update({
                status: 'in_progress',
                updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${safeId},document_id.eq.${safeId}`)
            .select('id');

        // Scope the update to this contractor when using JWT auth
        const { data: updatedRows, error: updateError } = contractorId
            ? await updateQuery.eq('contractor_id', contractorId)
            : await updateQuery;

        if (updateError) {
            console.error('start-job: error updating booking:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        const updatedId = String((updatedRows as any)?.[0]?.id ?? bookingId);
        await logBookingEvent({
            bookingId: updatedId,
            fromStatus: contractorId ? 'en_route' : 'confirmed',
            toStatus: 'in_progress',
            actorId: contractorId,
            actorType: 'contractor',
        });

        // Send notification email to customer that job has started
        if (updatedId) {
            const { data: fullBooking } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', updatedId)
                .single();

            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'contractor.job_started',
                booking: fullBooking ?? ({ id: updatedId } as any),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('start-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
