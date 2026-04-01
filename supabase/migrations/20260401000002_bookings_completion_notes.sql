-- Add completion_notes to bookings so contractors can leave a note when completing a job.
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS completion_notes text;
