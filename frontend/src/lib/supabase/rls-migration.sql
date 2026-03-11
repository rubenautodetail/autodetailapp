-- ============================================================
-- RLS MIGRATION — Run this in Supabase SQL Editor (Dashboard)
-- ============================================================
-- Tables: services, add_ons, bookings, profiles, vehicles, notifications
-- profiles, vehicles, notifications already have RLS from schema.sql
-- This script adds RLS to: services, add_ons, bookings
--
-- IMPORTANT: All server-side API routes that write to bookings/profiles
-- already use createServiceClient() (service role key) which BYPASSES RLS.
-- These policies only affect client-side (anon key) access.
-- ============================================================

-- ============================================================
-- 1. SERVICES — Public read, admin-only write
-- ============================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can read services (they're the public catalog)
CREATE POLICY "Services are publicly readable"
  ON public.services FOR SELECT
  USING (true);

-- Only admins can write (service role key bypasses this anyway)
CREATE POLICY "Only admins can insert services"
  ON public.services FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can update services"
  ON public.services FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can delete services"
  ON public.services FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 2. ADD_ONS — Public read, admin-only write
-- ============================================================
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Add-ons are publicly readable"
  ON public.add_ons FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert add-ons"
  ON public.add_ons FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can update add-ons"
  ON public.add_ons FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can delete add-ons"
  ON public.add_ons FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 3. BOOKINGS — Layered read access, protected writes
-- ============================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- READ: Anon users can read bookings (needed for approve/receipt pages
-- which are accessed via email links without login).
-- Admin pages also read client-side with anon key until auth is wired.
-- TODO: After auth is implemented, replace this with role-scoped policies:
--   admin→all, contractor→assigned, customer→own email match
CREATE POLICY "Bookings are readable (pre-auth)"
  ON public.bookings FOR SELECT
  USING (true);

-- INSERT: Only via service role key (API routes).
-- Block anonymous/unauthenticated inserts from browser.
CREATE POLICY "No anonymous booking inserts"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE: Only via service role key (API routes).
-- Block anonymous updates from browser.
CREATE POLICY "No anonymous booking updates"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
  );

-- DELETE: Only via service role key.
CREATE POLICY "No anonymous booking deletes"
  ON public.bookings FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 4. PROFILES — Already has RLS enabled.
-- Existing: public select, self insert, self update.
-- Add: admin can update any profile (role changes via admin panel).
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update any profile') THEN
        CREATE POLICY "Admins can update any profile"
          ON public.profiles FOR UPDATE
          USING (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
          );
    END IF;
END
$$;

-- ============================================================
-- VERIFICATION — Run after migration to confirm
-- ============================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
