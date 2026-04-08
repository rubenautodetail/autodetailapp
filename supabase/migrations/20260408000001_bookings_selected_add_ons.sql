-- Store which add-ons the customer selected for each booking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS selected_add_ons jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.bookings.selected_add_ons
  IS 'JSON array of add-ons selected at booking time, e.g. [{"name":"Clay Bar","price":30}]';
