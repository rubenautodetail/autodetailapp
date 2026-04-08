/**
 * POST /api/booking/payment-reminder
 *
 * Called by Upstash QStash at 15 min, 2 h, and 24 h after booking creation.
 * Verifies the QStash signature, checks the booking is still pending_payment,
 * and sends an escalating reminder email via Resend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQStashReceiver } from '@/lib/qstash';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPaymentReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // ── 1. Verify QStash signature ────────────────────────────────────────────
    const signature = req.headers.get('upstash-signature') ?? '';
    const body = await req.text();

    try {
        const receiver = getQStashReceiver();
        await receiver.verify({ signature, body, url: req.url });
    } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── 2. Parse payload ──────────────────────────────────────────────────────
    let bookingId: number | string;
    let reminderNumber: 1 | 2 | 3;

    try {
        const payload = JSON.parse(body);
        bookingId = payload.bookingId;
        reminderNumber = payload.reminderNumber;
        if (!bookingId || ![1, 2, 3].includes(reminderNumber)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // ── 3. Fetch booking — only proceed if still pending_payment ──────────────
    const supabase = createServiceClient();
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('id, status, customer_name, customer_email, customer_phone, service_name, date, time_window, total_amount, confirmation_code, payment_intent_id')
        .eq('id', bookingId)
        .single();

    if (error || !booking) {
        console.log(`payment-reminder: booking ${bookingId} not found — skipping`);
        return NextResponse.json({ skipped: true, reason: 'not_found' });
    }

    if (booking.status !== 'pending_payment') {
        console.log(`payment-reminder: booking ${bookingId} is "${booking.status}" — no reminder needed`);
        return NextResponse.json({ skipped: true, reason: 'already_resolved', status: booking.status });
    }

    // ── 4. Send the reminder email ────────────────────────────────────────────
    try {
        const emailData = {
            id: booking.id,
            confirmationCode: booking.confirmation_code ?? '',
            scheduledDate: booking.date,
            scheduledTime: booking.time_window ?? '',
            totalAmount: Number(booking.total_amount),
            paymentStatus: booking.status,
            paymentIntentId: booking.payment_intent_id,
            customer: {
                firstName: booking.customer_name?.split(' ')[0] ?? '',
                lastName: booking.customer_name?.split(' ').slice(1).join(' ') ?? '',
                email: booking.customer_email ?? '',
                phone: booking.customer_phone ?? '',
            },
            service: { name: booking.service_name ?? 'Detailing Service' },
            location: { address: '', city: '', state: '', zipCode: '' },
            vehicle: {},
        };

        await sendPaymentReminderEmail(emailData, reminderNumber);
    } catch (emailErr) {
        console.error('payment-reminder: email send failed:', emailErr);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reminderNumber, bookingId });
}
