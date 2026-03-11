-- Add booking_id FK to notifications so in-app alerts can link to a specific booking.
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notifications_booking_id_idx ON public.notifications(booking_id);
