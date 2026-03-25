// POST /api/cron/auto-approve  ← triggered by Upstash QStash every minute (signature verified)
// GET  /api/cron/auto-approve  ← manual trigger with CRON_SECRET (testing/admin)
//
// Reminder schedule (from pending_approval_at):
//   T+2  min → "Your car is ready — please come inspect"
//   T+5  min → reminder #2
//   T+10 min → "5 minutes left before auto-approval"
//   T+13 min → "2 minutes left — final warning"
//   T+15 min → Auto-approve: capture payment, mark completed
//
// Also alerts admin for bookings approaching the 7-day Stripe void window.

import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { createServiceClient } from '@/lib/supabase/server';
import { capturePaymentIntent } from '@/lib/stripe/server';
import { notify } from '@/lib/notifications';
import { sendApprovalReminderEmail } from '@/lib/email';

const AUTO_APPROVE_MINUTES = 15;

const REMINDERS = [
    { atMinute: 2,  type: 'approval_reminder_1', minutesRemaining: 13 },
    { atMinute: 5,  type: 'approval_reminder_2', minutesRemaining: 10 },
    { atMinute: 10, type: 'approval_reminder_3', minutesRemaining: 5  },
    { atMinute: 13, type: 'approval_reminder_4', minutesRemaining: 2  },
] as const;

async function runAutoApprove(): Promise<NextResponse> {
    try {
        const supabase = createServiceClient();
        const now = Date.now();

        // --- 7-day Stripe void window alert ---
        const sixDayCutoff = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
        const { data: expiringBookings } = await supabase
            .from('bookings')
            .select('id, confirmation_code')
            .eq('payment_status', 'authorized')
            .lt('created_at', sixDayCutoff);

        if (expiringBookings && expiringBookings.length > 0) {
            const ids = expiringBookings.map((b) => b.confirmation_code).join(', ');
            console.error(`URGENT: ${expiringBookings.length} booking(s) approaching 7-day Stripe void window: ${ids}`);
            await supabase.from('notifications').insert(
                expiringBookings.map((b) => ({
                    user_id: null,
                    type: 'admin.expiring_payment',
                    title: 'Payment About to Expire',
                    message: `Booking #${b.confirmation_code} has an authorized payment voiding in <24h. Capture or cancel now.`,
                    booking_id: b.id,
                    is_read: false,
                }))
            );
        }

        // --- Fetch all pending_approval bookings ---
        const { data: pendingBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'pending_approval')
            .eq('payment_status', 'authorized');

        if (error) {
            console.error('Auto-approve cron query error:', error);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        if (!pendingBookings || pendingBookings.length === 0) {
            return NextResponse.json({ processed: 0, reminders: 0, message: 'Nothing to do' });
        }

        // Fetch already-sent reminder notifications in one query
        const bookingIds = pendingBookings.map((b) => b.id);
        const { data: sentNotifs } = await supabase
            .from('notifications')
            .select('booking_id, type')
            .in('booking_id', bookingIds)
            .in('type', REMINDERS.map((r) => r.type));

        const sent = new Set((sentNotifs ?? []).map((n) => `${n.booking_id}:${n.type}`));

        let processed = 0;
        let failed = 0;
        let reminders = 0;

        for (const booking of pendingBookings) {
            try {
                const startTs = (booking as any).pending_approval_at ?? (booking as any).updated_at;
                if (!startTs) {
                    console.error(`Booking ${booking.id} has no pending_approval_at or updated_at — skipping`);
                    continue;
                }
                const elapsedMinutes = (now - new Date(startTs).getTime()) / 60_000;

                // Auto-approve at 15 minutes
                if (elapsedMinutes >= AUTO_APPROVE_MINUTES) {
                    if (!(booking as any).payment_intent_id) continue;

                    try {
                        await capturePaymentIntent((booking as any).payment_intent_id);
                    } catch (stripeError) {
                        console.error(`Stripe capture failed for booking ${booking.id}:`, stripeError);
                        await supabase
                            .from('bookings')
                            .update({ status: 'cancelled', payment_status: 'failed', updated_at: new Date().toISOString() })
                            .eq('id', booking.id);
                        failed++;
                        continue;
                    }

                    await supabase
                        .from('bookings')
                        .update({ status: 'completed', payment_status: 'paid', updated_at: new Date().toISOString() })
                        .eq('id', booking.id);

                    const serviceName = (booking as any).service_name || 'Detailing Service';
                    let contractorEmail = '';
                    if ((booking as any).contractor_id) {
                        const { data: cp } = await supabase
                            .from('profiles').select('email').eq('id', (booking as any).contractor_id).single();
                        contractorEmail = cp?.email ?? '';
                    }
                    await notify({ type: 'booking.approved', booking: { ...booking, service_name: serviceName }, contractorEmail });
                    processed++;
                    continue;
                }

                // Send the next unsent reminder for this booking
                for (let i = REMINDERS.length - 1; i >= 0; i--) {
                    const rem = REMINDERS[i];
                    if (elapsedMinutes < rem.atMinute) continue;
                    if (sent.has(`${booking.id}:${rem.type}`)) continue;

                    let customerEmail = (booking as any).customer_email ?? '';
                    if (!customerEmail && (booking as any).user_id) {
                        const { data: authData } = await supabase.auth.admin.getUserById((booking as any).user_id);
                        customerEmail = authData?.user?.email ?? '';
                    }
                    if (!customerEmail) break;

                    await sendApprovalReminderEmail(
                        {
                            id: booking.id,
                            service: { name: (booking as any).service_name || 'Detailing Service' },
                            customer: {
                                email: customerEmail,
                                firstName: (booking as any).customer_name || (booking as any).first_name || 'there',
                            },
                            confirmationCode: (booking as any).confirmation_code ?? '',
                        },
                        rem.minutesRemaining
                    );

                    await supabase.from('notifications').insert({
                        user_id: (booking as any).user_id ?? null,
                        type: rem.type,
                        title: 'Approval Reminder Sent',
                        message: `Reminder sent with ${rem.minutesRemaining} min remaining.`,
                        booking_id: booking.id,
                        is_read: true,
                    });

                    sent.add(`${booking.id}:${rem.type}`);
                    reminders++;
                    break;
                }
            } catch (err) {
                console.error(`Auto-approve processing failed for booking ${booking.id}:`, err);
                failed++;
            }
        }

        console.log(`Auto-approve cron: approved=${processed}, reminders=${reminders}, failed=${failed}`);
        return NextResponse.json({ processed, reminders, failed, total: pendingBookings.length });
    } catch (error) {
        console.error('Auto-approve cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// QStash POST — signature verified automatically by verifySignatureAppRouter
export const POST = verifySignatureAppRouter(async () => runAutoApprove());

// Manual GET — protected by CRON_SECRET
export async function GET(req: NextRequest) {
    const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return runAutoApprove();
}
