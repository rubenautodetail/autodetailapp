import { createServiceClient } from '@/lib/supabase/server';

interface BookingEventParams {
  bookingId: string;
  fromStatus?: string;
  toStatus: string;
  actorId?: string;
  actorType: 'customer' | 'contractor' | 'system' | 'admin';
  notes?: string;
}

export async function logBookingEvent(params: BookingEventParams): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('booking_events').insert({
      booking_id: params.bookingId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      actor_id: params.actorId,
      actor_type: params.actorType,
      notes: params.notes,
    });
  } catch (err) {
    // Non-fatal — never block the main flow
    console.error('[BookingEvent] Failed to log:', err);
  }
}
