-- Tanda 15: where each booking came from (ads, social, Google Business posts).
-- All columns are optional, so old bookings and bookings without a source keep working.
alter table public.bookings
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists gclid        text,
  add column if not exists landing_page text;
