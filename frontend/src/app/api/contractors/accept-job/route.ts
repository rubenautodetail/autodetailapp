import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';
import { stripe } from '@/lib/stripe/server';

interface ApprovalCheck {
    approval_status: string | null;
}

interface ContractorProfile {
    full_name: string | null;
    phone_number: string | null;
}

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
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
        if ((approvalCheck as ApprovalCheck | null)?.approval_status !== 'approved') {
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

        // Payment must be authorized before anyone can take the job.
        if (existingBooking.payment_status !== 'authorized' || !existingBooking.payment_intent_id) {
            return NextResponse.json(
                { error: 'This job is not available.' },
                { status: 409 }
            );
        }

        // Check with Stripe that the hold on the card is still valid.
        try {
            const pi = await stripe.paymentIntents.retrieve(existingBooking.payment_intent_id, {
                expand: ['latest_charge'],
            });
            if (pi.status !== 'requires_capture') {
                return NextResponse.json(
                    { error: 'This job is no longer available (payment hold is not active).' },
                    { status: 409 }
                );
            }
            // The hold must still be valid until the end of the service day (Eastern, with margin).
            const charge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
            const captureBefore = (charge as any)?.payment_method_details?.card?.capture_before as number | undefined;
            if (captureBefore && /^\d{4}-\d{2}-\d{2}/.test(String(existingBooking.date))) {
                const needBy = Date.parse(String(existingBooking.date).slice(0, 10) + 'T00:00:00Z') + 29 * 3600 * 1000;
                if (captureBefore * 1000 < needBy) {
                    return NextResponse.json(
                        { error: 'This job is no longer available (payment hold expires before the service date).' },
                        { status: 409 }
                    );
                }
            }
        } catch (stripeError) {
            console.error('accept-job: could not verify payment with Stripe:', stripeError);
            return NextResponse.json(
                { error: 'Could not verify the payment right now. Please try again in a moment.' },
                { status: 503 }
            );
        }

        const contractorId = userId;

        // Atomic first-come-first-served: only update if still pending and unassigned.
        // If another contractor already claimed it, this returns zero rows.
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                contractor_id: contractorId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingBooking.id)
            .eq('status', 'pending_assignment')
            .is('contractor_id', null)
            .select()
            .single();

        if (updateError && updateError.code === 'PGRST116') {
            // PGRST116 = "JSON object requested, multiple (or no) rows returned"
            // This means the booking was already claimed by another contractor
            return NextResponse.json(
                { error: 'This job has already been accepted by another contractor' },
                { status: 409 }
            );
        }

        if (updateError) {
            console.error('accept-job: error updating booking:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Send notification email to customer. Fetch contractor profile for the email.
        let contractorData: ContractorProfile | null = null;

        let contractorEmail = '';
        if (contractorId) {
            const { data: contractorInfo } = await supabase
                .from('profiles')
                .select('full_name, phone_number')
                .eq('id', contractorId)
                .single();
            contractorData = contractorInfo;
            // Fetch email from auth so we can send the confirmation
            const { data: authUser } = await supabase.auth.admin.getUserById(contractorId);
            contractorEmail = authUser?.user?.email ?? '';
        }

        if (updatedBooking) {
            const { notify } = await import('@/lib/notifications');
            await notify({
                type: 'contractor.job_accepted',
                booking: updatedBooking,
                contractor: contractorData ?? {},
                contractorEmail,
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
