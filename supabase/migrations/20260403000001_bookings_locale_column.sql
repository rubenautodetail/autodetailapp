-- Store the user's language so emails and notifications use the correct locale.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en';
