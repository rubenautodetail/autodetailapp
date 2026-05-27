-- Platform-wide scheduling controls so admin can decide which days are open,
-- the booking window, and minimum lead time. Defaults preserve existing behavior.

CREATE TABLE IF NOT EXISTS public.platform_schedule_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  weekday_defaults JSONB NOT NULL DEFAULT
    '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true,"sun":true}'::jsonb,
  booking_window_days INT NOT NULL DEFAULT 14 CHECK (booking_window_days BETWEEN 1 AND 90),
  min_lead_time_hours INT NOT NULL DEFAULT 1 CHECK (min_lead_time_hours BETWEEN 0 AND 168),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.platform_schedule_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.platform_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.platform_blocked_dates(date);

ALTER TABLE public.platform_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_blocked_dates    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read settings" ON public.platform_schedule_settings;
DROP POLICY IF EXISTS "public read blocked"  ON public.platform_blocked_dates;

CREATE POLICY "public read settings" ON public.platform_schedule_settings FOR SELECT USING (true);
CREATE POLICY "public read blocked"  ON public.platform_blocked_dates     FOR SELECT USING (true);

-- Writes happen only via createServiceClient() in admin API routes; no INSERT/UPDATE/DELETE
-- policies are intentionally defined.
