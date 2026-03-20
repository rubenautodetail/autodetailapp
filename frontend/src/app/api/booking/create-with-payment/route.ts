/**
 * POST /api/booking/create-with-payment
 *
 * Atomic replacement for the two-step booking/create → payments/create-intent flow.
 * Creates a booking record and a Stripe PaymentIntent in a single request.
 *
 * If Stripe fails the booking is deleted from the DB before returning the error,
 * preventing orphaned bookings that were never paid for.
 *
 * Returns: { confirmationCode, clientSecret, paymentIntentId, bookingId }
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { rateLimit } from '@/lib/rateLimit';

function generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = 'RD-';
    for (let i = 0; i < 8; i++) {
        code += chars[bytes[i] % chars.length];
    }
    return code;
}

export async function POST(req: NextRequest) {
    if (await rateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'booking-create' })) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    // Require authentication — no guest bookings
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required. Please log in to book.' }, { status: 401 });
    }

    let body: {
        date?: string;
        timeWindow?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
        specialInstructions?: string;
        subtotal?: number;
        serviceFee?: number;
        total?: number;
        serviceName?: string;
        vehicleMake?: string;
        vehicleModel?: string;
        vehicleYear?: string;
        vehicleColor?: string;
        currency?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
        date, timeWindow, address, city, state, zipCode,
        customerName, customerEmail, customerPhone,
        specialInstructions, subtotal, serviceFee, total,
        serviceName, vehicleMake, vehicleModel, vehicleYear, vehicleColor,
        currency = 'usd',
    } = body;

    // Required field validation
    if (!date || !timeWindow || !address || !customerEmail || !customerName) {
        return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Phone validation — require exactly 10 digits when provided
    if (customerPhone) {
        const digits = customerPhone.replace(/\D/g, '');
        if (digits.length !== 10) {
            return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
        }
    }

    // Amount validation
    const amountCents = Math.round((total ?? 0) * 100);
    if (!total || amountCents <= 0) {
        return NextResponse.json({ error: 'Invalid booking total' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const confirmationCode = generateConfirmationCode();
    const userId = user?.id || null;

    // ── Step 1: Create booking ────────────────────────────────────────────────
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            user_id: userId,
            confirmation_code: confirmationCode,
            status: 'pending_payment',   // distinct from pending_assignment — not yet paid
            payment_status: 'unpaid',
            date,
            time_window: timeWindow,
            address,
            city: city || '',
            state: state || 'FL',
            zip_code: zipCode,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone || '',
            special_instructions: specialInstructions || '',
            subtotal: subtotal || 0,
            service_fee: serviceFee || 0,
            total_amount: total || 0,
            service_name: serviceName || null,
            vehicle_make: vehicleMake || null,
            vehicle_model: vehicleModel || null,
            vehicle_year: vehicleYear || null,
            vehicle_color: vehicleColor || null,
        })
        .select()
        .single();

    if (bookingError || !booking) {
        console.error('create-with-payment: booking insert failed:', bookingError);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const bookingDocId = String(booking.id);

    // ── Step 2: Create Stripe PaymentIntent ──────────────────────────────────
    // If this fails, we delete the booking so no orphaned records are left.
    let paymentIntent: { clientSecret: string | null; paymentIntentId: string; amount: number };
    try {
        paymentIntent = await createPaymentIntent({
            amount: amountCents,
            bookingId: bookingDocId,
            customerId: customerEmail,
            currency,
        });
    } catch (stripeErr) {
        // Rollback: remove the booking we just created
        await supabase.from('bookings').delete().eq('id', booking.id);

        console.error('create-with-payment: Stripe failed, booking rolled back:', stripeErr);
        return NextResponse.json(
            { error: 'Payment setup failed. Please try again or contact support.' },
            { status: 502 }
        );
    }

    // ── Step 3: Persist payment intent ID on the booking ─────────────────────
    await supabase
        .from('bookings')
        .update({
            payment_intent_id: paymentIntent.paymentIntentId,
        })
        .eq('id', booking.id);

    // ── Step 4: Notify contractors about the new job ─────────────────────────
    // Fire-and-forget — notification failure must not block the payment flow
    notifyContractors(supabase, booking, zipCode ?? '', serviceName ?? 'Detailing Service').catch(
        (err) => {
            console.error('create-with-payment: contractor notification failed:', err);
            Sentry.captureException(err, { tags: { context: 'contractor_notification', bookingId: booking.id } });
        }
    );

    return NextResponse.json({
        success: true,
        confirmationCode: booking.confirmation_code,
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: bookingDocId,
    });
}

// ── Contractor notification (fire-and-forget) ─────────────────────────────────

async function notifyContractors(
    supabase: ReturnType<typeof createServiceClient>,
    booking: Record<string, unknown>,
    zipCode: string,
    resolvedServiceName: string,
) {
    const bookingWithService = { ...booking, service_name: resolvedServiceName };

    // Confirm email to customer
    const { notify } = await import('@/lib/notifications');
    await notify({ type: 'booking.created', booking: bookingWithService });

    // Alert contractors in service area so they can claim the job
    const { data: contractors } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'contractor')
        .eq('approval_status', 'approved')
        .eq('onboarding_complete', true)
        .eq('is_available', true)
        .contains('service_area_zips', [zipCode]);

    if (!contractors || contractors.length === 0) return;

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
        booking_id: booking.id,
        is_read: false,
        link: `/contractor/jobs/${booking.id}`,
    }));

    const { error: notifError } = await supabase.from('notifications').insert(notificationRows);
    if (notifError) console.error('create-with-payment: notification insert failed:', notifError);
}
