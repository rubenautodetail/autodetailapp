-- Add booking_group_id to link multiple bookings in a single appointment
-- (e.g., customer books detailing for 3 vehicles at once, one checkout)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_group_id uuid;

-- Index for fast group lookups
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON bookings (booking_group_id) WHERE booking_group_id IS NOT NULL;
