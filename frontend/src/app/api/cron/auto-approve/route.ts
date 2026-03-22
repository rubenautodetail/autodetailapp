// GET /api/cron/auto-approve
// Auto-approves bookings that have been in 'pending_approval' for 24+ hours.
// The customer was sent an approval link; if they don't act, we auto-capture.
//
// IMPORTANT: Stripe voids uncaptured PaymentIntents after 7 days. This cron
// captures at 24 hours, well inside that window. However, if the cron stops
// running, any booking older than 7 days will have its PaymentIntent voided
// and capture will throw — those are handled below by marking status 'cancelled'.
//
// Trigger this via:
//   - Vercel Cron Jobs (vercel.json): daily (not hourly on Hobby)
//   - Upstash QStash: every minute (* * * * *) or hourly (0 * * * *)
//   - Railway cron
//
// Security: Requires CRON_SECRET header to prevent unauthorized access.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { capturePaymentIntent } from '@/lib/stripe/server';
import { notify } from '@/lib/notifications';

const AUTO_APPROVE_HOURS = 24;

export async function GET(req: NextRequest) {
    // Verify cron secret to prevent unauthorized triggers
    const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        const cutoff = new Date(Date.now() - AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();

        // Find bookings stuck in pending_approval for more than 24 hours
        const { data: staleBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'pending_approval')
            .eq('payment_status', 'authorized')
            .lt('updated_at', cutoff);

        if (error) {
            console.error('Auto-approve cron query error:', error);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        // Alert admin for bookings approaching the 7-day Stripe void window (> 6 days old)
        const sixDayCutoff = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
        const { data: expiringBookings } = await supabase
            .from('bookings')
            .select('id, confirmation_code')
            .eq('payment_status', 'authorized')
            .lt('created_at', sixDayCutoff);

        if (expiringBookings && expiringBookings.length > 0) {
            const ids = expiringBookings.map((b: Record<string, unknown>) => b.confirmation_code).join(', ');
            console.error(`URGENT: ${expiringBookings.length} booking(s) approaching 7-day Stripe void window: ${ids}`);
            // Insert admin notifications for each expiring booking
            await supabase.from('notifications').insert(
                expiringBookings.map((b: Record<string, unknown>) => ({
                    user_id: null,
                    type: 'admin.expiring_payment',
                    title: 'Payment About to Expire',
                    message: `Booking #${b.confirmation_code} has an authorized payment that will void in <24h. Capture or cancel now.`,
                    booking_id: b.id,
                    is_read: false,
                }))
            );
        }

        if (!staleBookings || staleBookings.length === 0) {
            return NextResponse.json({ processed: 0, message: 'No stale bookings found' });
        }

        let processed = 0;
        let failed = 0;

        for (const booking of staleBookings) {
            try {
                if (!booking.payment_intent_id) continue;

                // Capture the Stripe payment.
                // Throws if the 7-day hold window expired (intent was voided by Stripe).
                try {
                    await capturePaymentIntent(booking.payment_intent_id);
                } catch (stripeError) {
                    // Capture failed (e.g. intent voided after 7 days, or card declined).
                    // Mark booking cancelled so it can be re-queued or refunded.
                    console.error(`Stripe capture failed for booking ${booking.id}, marking cancelled:`, stripeError);
                    await supabase
                        .from('bookings')
                        .update({
                            status: 'cancelled',
                            payment_status: 'failed',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', booking.id);
                    failed++;
                    continue;
                }

                // Update booking status
                await supabase
                    .from('bookings')
                    .update({
                        status: 'completed',
                        payment_status: 'paid',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', booking.id);

                // Notify customer + contractor
                const serviceName = (booking as any).service_name || 'Detailing Service';
                let contractorEmail = '';
                if ((booking as any).contractor_id) {
                    const { data: contractorProfile } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', (booking as any).contractor_id)
                        .single();
                    contractorEmail = contractorProfile?.email ?? '';
                }
                await notify({
                    type: 'booking.approved',
                    booking: { ...booking, service_name: serviceName },
                    contractorEmail,
                });

                processed++;
            } catch (err) {
                console.error(`Auto-approve failed for booking ${booking.id}:`, err);
                failed++;
            }
        }

        console.log(`Auto-approve cron: processed=${processed}, failed=${failed}`);
        return NextResponse.json({ processed, failed, total: staleBookings.length });
    } catch (error) {
        console.error('Auto-approve cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
