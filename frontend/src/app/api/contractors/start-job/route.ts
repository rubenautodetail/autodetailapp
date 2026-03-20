import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';
import { notify } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        const supabase = createServiceClient();

        let bookingId: string;
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

            // Verify the code matches this booking before allowing the transition
            const { data: booking, error } = await supabase
                .from('bookings')
                .select('id, contractor_id, status, confirmation_code')
                .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
                .single();

            if (error || !booking) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }

            if (booking.confirmation_code !== confirmationCode) {
                return NextResponse.json({ error: 'Invalid confirmation code' }, { status: 403 });
            }

            if (booking.status !== 'confirmed') {
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
            contractorId = user.id;

            if (!bookingId) {
                return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
            }
        }

        const updateQuery = supabase
            .from('bookings')
            .update({
                status: 'in_progress',
                updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
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
            fromStatus: 'confirmed',
            toStatus: 'in_progress',
            actorId: contractorId,
            actorType: 'contractor',
        });

        // Send notification email to customer that job has started
        if (updatedId) {
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'contractor.job_started',
                booking: { id: updatedId } as any, // Minimal booking data for email
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('start-job API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
