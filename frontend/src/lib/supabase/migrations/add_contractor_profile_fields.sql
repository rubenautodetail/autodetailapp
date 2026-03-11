-- Add missing contractor profile fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS service_area_zips text[],
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{"days":["Mon","Tue","Wed","Thu","Fri","Sat"],"start_hour":8,"end_hour":18}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['en'],
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ratings integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_jobs_completed integer DEFAULT 0;
