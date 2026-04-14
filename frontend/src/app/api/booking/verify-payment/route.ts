/**
 * POST /api/booking/verify-payment
 *
 * Client-side fallback for when the Stripe webhook is delayed or missed.
 * Called from the confirmation page after Stripe redirects back.
 *
 * Checks the PaymentIntent status and transitions the booking out of
 * pending_payment if the card was successfully authorized.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    // Require authenticated user
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let body: { paymentIntentId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { paymentIntentId } = body;
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
        return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }

    // Validate format (Stripe PI IDs start with pi_)
    if (!/^pi_[a-zA-Z0-9_]+$/.test(paymentIntentId)) {
        return NextResponse.json({ error: 'Invalid paymentIntentId' }, { status: 400 });
    }

    // Retrieve the PaymentIntent from Stripe to verify its actual status
    let pi;
    try {
        pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
        console.error('verify-payment: failed to retrieve PI from Stripe:', err);
        return NextResponse.json({ error: 'Failed to retrieve payment status' }, { status: 502 });
    }

    // Only process authorized (requires_capture) or succeeded intents
    const isAuthorized = pi.status === 'requires_capture' || pi.status === 'succeeded';
    if (!isAuthorized) {
        return NextResponse.json({ status: pi.status, updated: false });
    }

    const supabase = createServiceClient();

    // Find the booking by payment_intent_id — only update if still pending_payment
    const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .eq('payment_status', 'unpaid')
        .maybeSingle();

    // Verify the booking belongs to the authenticated user
    if (booking && booking.user_id !== user.id && booking.customer_email !== user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (fetchErr) {
        console.error('verify-payment: booking lookup failed:', fetchErr);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!booking) {
        // Already processed (webhook got there first, or no matching booking)
        return NextResponse.json({ status: pi.status, updated: false, alreadyProcessed: true });
    }

    // Transition booking: pending_payment → pending_assignment (same as webhook)
    const { data: updatedBooking, error: updateErr } = await supabase
        .from('bookings')
        .update({ payment_status: 'authorized', status: 'pending_assignment' })
        .eq('id', booking.id)
        .eq('payment_status', 'unpaid') // idempotency guard
        .select()
        .single();

    if (updateErr || !updatedBooking) {
        console.error('verify-payment: booking update failed:', updateErr);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    console.log(`verify-payment: booking ${booking.id} transitioned to pending_assignment (fallback)`);

    // Notify contractors (same as webhook does)
    try {
        const serviceName = (updatedBooking as Record<string, unknown>).service_name as string || 'Detailing Service';
        const zipCode = (updatedBooking as Record<string, unknown>).zip_code as string || '';
        const bookingWithService = { ...updatedBooking, service_name: serviceName };

        const { notify } = await import('@/lib/notifications');

        // Booking confirmed email to customer
        await notify({ type: 'booking.confirmed', booking: bookingWithService }).catch(
            (err) => console.error('verify-payment: customer email failed:', err)
        );

        // Broadcast to all available contractors
        const { data: contractors } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('role', 'contractor')
            .eq('approval_status', 'approved')
            .eq('is_available', true);

        if (contractors && contractors.length > 0) {
            await Promise.all(
                contractors.map((c: { id: string; email: string }) =>
                    notify({
                        type: 'contractor.job_assigned',
                        booking: bookingWithService,
                        contractorEmail: c.email,
                    })
                )
            );

            const notificationRows = contractors.map((c: { id: string; email: string }) => ({
                user_id: c.id,
                type: 'info' as const,
                title: 'New Job Available',
                message: `New detailing job in ${zipCode}. Tap to view and accept.`,
                booking_id: updatedBooking.id,
                is_read: false,
                link: `/en/contractor/jobs/${updatedBooking.id}`,
            }));

            await supabase.from('notifications').insert(notificationRows);
        }
    } catch (notifyErr) {
        // Non-fatal — booking was updated, notifications are best-effort
        console.error('verify-payment: notification failed:', notifyErr);
    }

    return NextResponse.json({
        status: pi.status,
        updated: true,
        bookingId: booking.id,
        confirmationCode: (updatedBooking as Record<string, unknown>).confirmation_code,
    });
}
