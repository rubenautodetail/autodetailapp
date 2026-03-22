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
        perVehicleTotal?: number;
        serviceName?: string;
        vehicles?: Array<{ make?: string; model?: string; year?: string; color?: string }>;
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
        perVehicleTotal,
        serviceName, vehicles: vehiclesInput,
        vehicleMake, vehicleModel, vehicleYear, vehicleColor,
        currency = 'usd',
    } = body;

    // Build vehicles array — backwards compat: if no vehicles array, use single vehicle fields
    const vehicles = (vehiclesInput && vehiclesInput.length > 0)
        ? vehiclesInput
        : [{ make: vehicleMake, model: vehicleModel, year: vehicleYear, color: vehicleColor }];

    const vehicleCount = vehicles.length;
    const perVehicleAmount = perVehicleTotal ?? (total && vehicleCount > 1 ? total / vehicleCount : total ?? 0);

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
    const userId = user?.id || null;

    // Generate a group ID when booking multiple vehicles in one appointment
    const bookingGroupId = vehicleCount > 1 ? crypto.randomUUID() : null;

    // ── Step 1: Create booking(s) — one per vehicle ─────────────────────────
    const bookingRows = vehicles.map(v => ({
        user_id: userId,
        confirmation_code: generateConfirmationCode(),
        status: 'pending_payment' as const,
        payment_status: 'unpaid' as const,
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
        subtotal: perVehicleAmount,
        service_fee: serviceFee ? (serviceFee / vehicleCount) : 0,
        total_amount: perVehicleAmount,
        service_name: serviceName || null,
        vehicle_make: v.make || null,
        vehicle_model: v.model || null,
        vehicle_year: v.year || null,
        vehicle_color: v.color || null,
        ...(bookingGroupId ? { booking_group_id: bookingGroupId } : {}),
    }));

    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingRows)
        .select();

    if (bookingError || !bookings || bookings.length === 0) {
        console.error('create-with-payment: booking insert failed:', bookingError);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const bookingIds = bookings.map(b => String(b.id));
    const primaryBookingId = bookingIds[0];

    // ── Step 2: Create Stripe PaymentIntent ──────────────────────────────────
    // If this fails, we delete all bookings so no orphaned records are left.
    let paymentIntent: { clientSecret: string | null; paymentIntentId: string; amount: number };
    try {
        paymentIntent = await createPaymentIntent({
            amount: amountCents,
            bookingId: primaryBookingId,
            customerId: customerEmail ?? 'guest',
            currency,
        });
    } catch (stripeErr) {
        // Rollback: remove all bookings we just created
        await supabase.from('bookings').delete().in('id', bookings.map(b => b.id));

        console.error('create-with-payment: Stripe failed, bookings rolled back:', stripeErr);
        return NextResponse.json(
            { error: 'Payment setup failed. Please try again or contact support.' },
            { status: 502 }
        );
    }

    // ── Step 3: Persist payment intent ID on all bookings ────────────────────
    await supabase
        .from('bookings')
        .update({ payment_intent_id: paymentIntent.paymentIntentId })
        .in('id', bookings.map(b => b.id));

    // ── Step 4: Notify contractors about the new job ─────────────────────────
    // Fire-and-forget — notification failure must not block the payment flow
    notifyContractors(supabase, bookings[0], zipCode ?? '', serviceName ?? 'Detailing Service').catch(
        (err) => {
            console.error('create-with-payment: contractor notification failed:', err);
            Sentry.captureException(err, { tags: { context: 'contractor_notification', bookingId: bookings[0].id } });
        }
    );

    const confirmationCodes = bookings.map(b => b.confirmation_code);

    return NextResponse.json({
        success: true,
        confirmationCode: confirmationCodes[0],
        confirmationCodes,
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: primaryBookingId,
        bookingIds,
        bookingGroupId,
        vehicleCount,
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

    // Alert ALL approved contractors so they can claim the job.
    // NOTE: Service-area ZIP filtering is dormant — re-enable for geo-routing when needed.
    const { data: contractors } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'contractor')
        .eq('approval_status', 'approved')
        .eq('onboarding_complete', true)
        .eq('is_available', true);

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
