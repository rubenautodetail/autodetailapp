-- Sequential booking codes: RD-000100, RD-000101, ...
-- Replaces random alphanumeric codes with a guaranteed-unique sequence.
CREATE SEQUENCE IF NOT EXISTS booking_code_seq START WITH 100;

CREATE OR REPLACE FUNCTION generate_booking_code() RETURNS text AS $$
BEGIN
  RETURN 'RD-' || lpad(nextval('booking_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.bookings
  ALTER COLUMN confirmation_code SET DEFAULT generate_booking_code();

-- Unique constraint prevents duplicates
DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_confirmation_code_unique UNIQUE (confirmation_code);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Grant to Supabase roles so inserts auto-generate the code
GRANT USAGE, SELECT ON SEQUENCE booking_code_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_booking_code() TO anon, authenticated, service_role;
