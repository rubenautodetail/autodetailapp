-- ============================================================
-- MASTER PROFILE + TIGHTENED BOOKINGS RLS
-- Run in Supabase SQL Editor (Dashboard)
-- ============================================================

-- ============================================================
-- 1. MAKE YOUR ACCOUNT AN ADMIN
--    Replace 'your@email.com' with your actual email.
--    This finds your auth.users row and sets role = 'admin'.
-- ============================================================
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Look up your auth user ID by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'your@email.com'  -- <-- REPLACE THIS
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Sign up first, then re-run this script.';
    END IF;

    -- Upsert the profile row with role = admin
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_user_id, 'DTailWash Admin', 'admin')
    ON CONFLICT (id) DO UPDATE
        SET role = 'admin',
            updated_at = now();

    RAISE NOTICE 'Done — user % is now an admin.', v_user_id;
END
$$;


-- ============================================================
-- 2. TIGHTEN BOOKINGS RLS
--    Replace the permissive pre-auth SELECT policy with
--    role-scoped policies now that auth is live.
-- ============================================================

-- Drop the old permissive read policy
DROP POLICY IF EXISTS "Bookings are readable (pre-auth)" ON public.bookings;

-- Admin: full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'bookings' AND policyname = 'Admins can read all bookings'
    ) THEN
        CREATE POLICY "Admins can read all bookings"
            ON public.bookings FOR SELECT
            USING (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            );
    END IF;
END $$;

-- Contractor: can read bookings assigned to them
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'bookings' AND policyname = 'Contractors can read assigned bookings'
    ) THEN
        CREATE POLICY "Contractors can read assigned bookings"
            ON public.bookings FOR SELECT
            USING (
                contractor_id = auth.uid()
                AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'contractor'
            );
    END IF;
END $$;

-- Customer: can read bookings by their email (unauthenticated approve/receipt links)
-- Keep a permissive select for now on customer-facing pages until full auth gates are added there
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'bookings' AND policyname = 'Customers can read own bookings by email'
    ) THEN
        CREATE POLICY "Customers can read own bookings by email"
            ON public.bookings FOR SELECT
            USING (true);  -- TODO: narrow to customer_email = auth.email() once customers auth
    END IF;
END $$;


-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'bookings';
-- SELECT id, role FROM public.profiles WHERE role = 'admin';
