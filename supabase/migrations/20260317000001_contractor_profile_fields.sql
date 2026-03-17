-- Add contractor profile fields that were being collected in the form but not persisted
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS address          text,
    ADD COLUMN IF NOT EXISTS business_name    text,
    ADD COLUMN IF NOT EXISTS payment_preference text;

COMMENT ON COLUMN profiles.address             IS 'Home or business address from contractor application';
COMMENT ON COLUMN profiles.business_name       IS 'Business / LLC name from contractor application';
COMMENT ON COLUMN profiles.payment_preference  IS 'Preferred payout method: direct_deposit | zelle | check | cash';
