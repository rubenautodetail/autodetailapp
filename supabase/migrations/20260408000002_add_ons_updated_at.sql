-- Add updated_at column to add_ons table

ALTER TABLE public.add_ons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill existing rows
UPDATE public.add_ons SET updated_at = now() WHERE updated_at IS NULL;

-- Create a reusable trigger function (if it doesn't already exist)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at on row changes
DROP TRIGGER IF EXISTS trg_add_ons_updated_at ON public.add_ons;
CREATE TRIGGER trg_add_ons_updated_at
  BEFORE UPDATE ON public.add_ons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
