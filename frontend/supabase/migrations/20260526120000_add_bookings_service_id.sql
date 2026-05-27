-- Add service_id FK column to bookings so contractor notification can filter by skill.
-- Backfill from the existing service_name string where a matching active service exists.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES public.services(id) ON DELETE SET NULL;

UPDATE public.bookings b
SET service_id = s.id
FROM public.services s
WHERE b.service_id IS NULL
  AND b.service_name IS NOT NULL
  AND lower(s.name) = lower(b.service_name)
  AND s.is_active = true;

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
