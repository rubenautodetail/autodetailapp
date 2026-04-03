// GET /api/cron/send-review-reminders
// Sends review reminder emails to customers who completed jobs but haven't left reviews
// Trigger this via:
//   - Vercel Cron Jobs (vercel.json): daily "0 9 * * *"
//   - Upstash QStash
//   - Railway cron
//
// Security: Requires CRON_SECRET header to prevent unauthorized access.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

const REMINDER_AFTER_HOURS = 24; // Send reminder 24 hours after job completion
const MAX_REMINDERS = 2; // Maximum number of reminders to send per booking

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const secret = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    const cutoffTime = new Date(Date.now() - REMINDER_AFTER_HOURS * 60 * 60 * 1000).toISOString();

    // Find completed bookings that have not received a review yet
    const { data: completedBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        confirmation_code,
        customer_email,
        updated_at,
        service_name,
        contractor_id
      `)
      .eq('status', 'completed')
      .lt('updated_at', cutoffTime);

    if (error) {
      console.error('Review reminders cron query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!completedBookings || completedBookings.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No completed bookings found for reminders' });
    }

    let processed = 0;
    let failed = 0;

    for (const booking of completedBookings) {
      try {
        // Check if a review has been submitted — reviews now stored on bookings.review_rating
        const { data: reviewedBooking, error: reviewError } = await supabase
          .from('bookings')
          .select('review_rating')
          .eq('id', booking.id)
          .single();

        if (reviewError) throw reviewError;

        if (reviewedBooking?.review_rating !== null && reviewedBooking?.review_rating !== undefined) {
          // Review already submitted, skip
          continue;
        }

        // Count how many review reminders have been sent for this booking
        const { error: countError, count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('booking_id', booking.id)
          .eq('type', 'booking.review_request');

        if (countError) {
          throw countError;
        }

        const countValue = count ?? 0;

        if (countValue >= MAX_REMINDERS) {
          // Already sent maximum reminders, skip
          continue;
        }

        // Send review reminder email
        await notify({
          type: 'booking.review_request',
          booking: {
            id: booking.id,
            confirmation_code: booking.confirmation_code,
            scheduled_date: new Date().toISOString().split('T')[0], // Today as fallback
            scheduled_time: 'Service completed',
            service_name: booking.service_name || 'Detailing Service',
            total_amount: 0, // Not needed for reminder email
            payment_status: 'paid',
            customer: {
              email: booking.customer_email,
              first_name: 'there',
              last_name: '',
              phone: ''
            }
          } as any
        });

        processed++;
      } catch (err) {
        console.error(`Failed to send review reminder for booking ${booking.id}:`, err);
        failed++;
      }
    }

    console.log(`Review reminders cron: processed=${processed}, failed=${failed}, total considered=${completedBookings.length}`);
    return NextResponse.json({ processed, failed, total: completedBookings.length });
  } catch (error) {
    console.error('Review reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}