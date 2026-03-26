-- Add review columns to bookings table
-- The reviews API (POST /api/reviews) writes to these columns.
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS review_rating   smallint    CHECK (review_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_comment  text,
  ADD COLUMN IF NOT EXISTS reviewed_at     timestamptz;

-- Index for fast contractor rating recalculation
CREATE INDEX IF NOT EXISTS idx_bookings_contractor_review
  ON public.bookings (contractor_id, review_rating)
  WHERE review_rating IS NOT NULL;
