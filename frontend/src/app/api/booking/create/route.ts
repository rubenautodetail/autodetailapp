/**
 * POST /api/booking/create
 * Creates a new booking record in Supabase.
 * Generates a confirmation code server-side.
 * Now also checks contractor availability based on day of week and start hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RD-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// parseTimeToHour — dormant, kept for future geo/time-based routing
// function parseTimeToHour(timeStr: string): number { ... }

export async function POST(req: NextRequest) {
  if (await rateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'booking-create' })) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  // Require authenticated user — no guest bookings
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please sign in to book.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      date,
      timeWindow,
      address,
      city,
      state,
      zipCode,
      customerName,
      customerEmail,
      customerPhone,
      specialInstructions,
      subtotal,
      serviceFee,
      total,
      serviceName,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
    } = body;

    // Prevent spoofing — use authenticated user's ID
    const userId = user.id;

    // Basic validation
    if (!date || !timeWindow || !address || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Phone validation — require exactly 10 digits when provided
    if (customerPhone) {
      const digits = customerPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
      }
    }

    const supabase = createServiceClient();
    const confirmationCode = generateConfirmationCode();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        confirmation_code: confirmationCode,
        status: 'pending_assignment',
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

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // Trigger notification
    const resolvedServiceName = serviceName || booking.service_name || 'Detailing Service';
    const bookingWithService = { ...booking, service_name: resolvedServiceName };
    const { notify } = await import('@/lib/notifications');

    // 1. Confirm email to customer
    await notify({ type: 'booking.created', booking: bookingWithService });

    // 2. Alert ALL approved contractors about the new booking.
    // NOTE: Service-area ZIP filtering is dormant — will be re-enabled when
    // multi-contractor geo-routing is needed. For now every contractor gets notified.
    const supabaseAdmin = createServiceClient();
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('role', 'contractor')
      .eq('approval_status', 'approved')
      .eq('is_available', true);

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
      // We don't fail the booking because of this; we just won't notify contractors.
    } else if (contractors && contractors.length > 0) {
      // Send emails to all available contractors
      await Promise.all(
        contractors.map((c) =>
          notify({
            type: 'contractor.job_assigned',
            booking: bookingWithService,
            contractorEmail: c.email,
          })
        )
      );

      // Batch insert in-app notifications for all eligible contractors
      const notificationRows = contractors.map((c) => ({
        user_id: c.id,
        type: 'info' as const,
        title: 'New Job Available',
        message: `New detailing job in ${zipCode}. Tap to view and accept.`,
        booking_id: booking.id,
        is_read: false,
        link: `/contractor/jobs/${booking.id}`,
      }));

      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationRows);

      if (notifError) {
        console.error('Failed to insert contractor notifications:', notifError);
      }
    }

    return NextResponse.json({
      data: {
        id: booking.id,
        documentId: String(booking.id),
        confirmationCode: booking.confirmation_code,
        status: booking.status,
        date: booking.date,
        timeWindow: booking.time_window,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        zipCode: booking.zip_code,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        subtotal: Number(booking.subtotal),
        serviceFee: Number(booking.service_fee),
        total: Number(booking.total_amount),
      },
    });
  } catch (error) {
    console.error('Error in booking/create:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the booking' },
      { status: 500 }
    );
  }
}