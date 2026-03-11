/**
 * POST /api/booking/approve
 * Handles customer approval of a completed job.
 * Requires the booking's confirmation_code to prevent unauthorized captures.
 * Captures the Stripe payment and updates booking status to 'completed'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturePaymentIntent } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';
import { logBookingEvent } from '@/lib/supabase/logBookingEvent';

export async function POST(req: NextRequest) {
    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { bookingId, confirmationCode } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        if (!confirmationCode) {
            return NextResponse.json({ error: 'Confirmation code is required' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Look up booking to get payment intent ID, current status, and confirmation code
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify confirmation code matches — prevents unauthorized payment captures
        if (booking.confirmation_code !== confirmationCode) {
            return NextResponse.json({ error: 'Invalid confirmation code' }, { status: 403 });
        }

        if (!booking.payment_intent_id) {
            return NextResponse.json({ error: 'No payment intent found for this booking' }, { status: 400 });
        }

        if (booking.status !== 'pending_approval') {
            return NextResponse.json(
                { error: `Cannot approve: booking status is ${booking.status}` },
                { status: 400 }
            );
        }

        if (booking.payment_status !== 'authorized') {
            return NextResponse.json(
                { error: `Cannot capture payment: payment status is ${booking.payment_status}` },
                { status: 400 }
            );
        }

        // Capture the funds via Stripe.
        // If capture throws (card declined, or 7-day hold window expired and intent voided),
        // revert the booking to cancelled so it can be re-queued.
        let paymentIntent;
        try {
            paymentIntent = await capturePaymentIntent(booking.payment_intent_id);
        } catch (stripeError) {
            console.error('Stripe capture failed during approve, reverting booking:', stripeError);
            await supabase
                .from('bookings')
                .update({ payment_status: 'failed', status: 'cancelled' })
                .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);
            return NextResponse.json(
                { error: `Payment capture failed: ${(stripeError as Error).message}` },
                { status: 502 }
            );
        }

        // Update booking in Supabase
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_status: 'paid',
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .or(`id.eq.${bookingId},document_id.eq.${bookingId}`);

        if (updateError) {
            throw new Error(`Failed to update booking status: ${updateError.message}`);
        }

        // Look up contractor email for paid notification
        let contractorEmail = '';
        if (booking.contractor_id) {
            const { data: contractorProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', booking.contractor_id)
                .single();
            contractorEmail = contractorProfile?.email || '';
        }

        // Notify customer and contractor
        const serviceName = (booking as any).service_name || 'Detailing Service';
        const bookingWithService = { ...booking, service_name: serviceName };

        await notify({
            type: 'booking.approved',
            booking: bookingWithService,
            contractorEmail,
        });

        await logBookingEvent({
            bookingId: String(booking.id),
            fromStatus: 'pending_approval',
            toStatus: 'completed',
            actorType: 'customer',
        });

        return NextResponse.json({
            success: true,
            status: paymentIntent.status,
        });
    } catch (error) {
        console.error('Customer approve error:', error);
        return NextResponse.json(
            { error: `Failed to approve and capture payment: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
