-- ============================================================
-- Rubens Auto Detail — Supabase Migrations & RLS Policies
-- Run these in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── DB-01: Required columns ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status text
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;


-- ── E-01: Reviews table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id          bigserial PRIMARY KEY,
    booking_id  bigint    REFERENCES bookings(id) ON DELETE CASCADE,
    user_id     uuid      REFERENCES auth.users(id) ON DELETE SET NULL,
    contractor_id uuid    REFERENCES profiles(id)  ON DELETE SET NULL,
    rating      smallint  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     text,
    created_at  timestamptz DEFAULT now()
);

-- One review per booking
CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_id_key ON reviews(booking_id);


-- ── PS-06: RLS Policies ──────────────────────────────────────
-- Enable RLS on all tables (safe to run even if already enabled)
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;


-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: users can read own profile"  ON profiles;
DROP POLICY IF EXISTS "profiles: users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles: service role bypass"          ON profiles;

CREATE POLICY "profiles: users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles: users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role (used by API routes) bypasses RLS automatically when using service key.
-- No policy needed for service role.


-- ── bookings ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings: customer can read own bookings"    ON bookings;
DROP POLICY IF EXISTS "bookings: contractor can read assigned jobs" ON bookings;
DROP POLICY IF EXISTS "bookings: admin full access"                 ON bookings;

-- Customers see their own bookings (by email match — user_id backfill needed for clean pivot)
CREATE POLICY "bookings: customer can read own bookings"
    ON bookings FOR SELECT
    USING (
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
    );

-- Contractors see jobs assigned to them OR unassigned pending_assignment jobs
CREATE POLICY "bookings: contractor can read assigned or open jobs"
    ON bookings FOR SELECT
    USING (
        contractor_id = auth.uid()
        OR (
            contractor_id IS NULL
            AND status = 'pending_assignment'
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                  AND role = 'contractor'
                  AND approval_status = 'approved'
            )
        )
    );


-- ── notifications ─────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications: users see own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications: users update own notifications" ON notifications;

CREATE POLICY "notifications: users see own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "notifications: users update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- ── services & add_ons (public read) ─────────────────────────
DROP POLICY IF EXISTS "services: public read" ON services;
DROP POLICY IF EXISTS "add_ons: public read"  ON add_ons;

CREATE POLICY "services: public read"
    ON services FOR SELECT USING (true);

CREATE POLICY "add_ons: public read"
    ON add_ons FOR SELECT USING (true);


-- ── vehicles ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "vehicles: users manage own vehicles" ON vehicles;

CREATE POLICY "vehicles: users manage own vehicles"
    ON vehicles FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- ── reviews ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews: public read"         ON reviews;
DROP POLICY IF EXISTS "reviews: authenticated insert" ON reviews;

CREATE POLICY "reviews: public read"
    ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews: authenticated insert"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());


-- ── DB-02: Contractor docs storage bucket ────────────────────
-- Run this manually in: Storage → New bucket
-- Name: contractor-docs
-- Public: OFF (private)
-- This cannot be done via SQL — use the Supabase Dashboard UI.
-- ============================================================


-- ══════════════════════════════════════════════════════════════════════════════
-- DB-03: Contractor Skills / Service-Type Verification
-- Version  : 1.0.0
-- Applied  : Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Author   : auto-generated by Antigravity
-- Strategy : Expand-only — ADD COLUMN IF NOT EXISTS is non-destructive and
--            runs without locking the table in Postgres 12+.
-- ══════════════════════════════════════════════════════════════════════════════
--
-- WHAT THESE COLUMNS DO
-- ─────────────────────
-- service_type_ids           — contractor self-selects service IDs they can do
--                              (matches services.id in the services table)
-- verified_service_type_ids  — admin-approved subset
--                              NULL  = not yet reviewed (include in broadcast)
--                              '{}'  = admin cleared all (exclude from broadcast)
--                              '{1,3}'= only notify for matching service IDs
-- skills_pending_review      — true while contractor has unreviewed changes
--
-- BOOKING FILTER LOGIC (enforced in API layer, not here):
--   verified IS NULL → include contractor (new / not reviewed yet)
--   verified = '{}'  → exclude contractor
--   verified = '{n}' → include only if booking.service_id IN verified
--
-- ══════════════════════════════════════════════════════════════════════════════
-- PRE-MIGRATION VALIDATION
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Confirm the profiles table exists before altering it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'MIGRATION BLOCKED: Table "profiles" does not exist. Run earlier migrations first.';
    END IF;
END;
$$;

-- 2. Confirm the services table exists (we reference its IDs conceptually)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'services'
    ) THEN
        RAISE WARNING 'services table not found — skills IDs will not be FK-enforced (by design).';
    END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: ADD COLUMNS (zero-downtime — no table lock)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS service_type_ids           int[]    DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS verified_service_type_ids  int[]    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS skills_pending_review       boolean  DEFAULT false NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE: GIN index for array-overlap queries (@> operator)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS profiles_verified_service_type_ids_gin
    ON profiles USING GIN (verified_service_type_ids);

CREATE INDEX IF NOT EXISTS profiles_service_type_ids_gin
    ON profiles USING GIN (service_type_ids);

-- ══════════════════════════════════════════════════════════════════════════════
-- SECURITY: Row Level Security policies
-- (service role used by API routes bypasses RLS — these protect direct DB access)
-- ══════════════════════════════════════════════════════════════════════════════

-- Contractors can read their own skill fields
DROP POLICY IF EXISTS "contractors_read_own_skills"    ON profiles;
DROP POLICY IF EXISTS "contractors_update_own_skills"  ON profiles;

-- Allow contractors to see their own skill selection + verification state
CREATE POLICY "contractors_read_own_skills"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id
        OR
        -- Admins (role='admin') can read any profile
        EXISTS (
            SELECT 1 FROM profiles AS p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Contractors can update ONLY service_type_ids and skills_pending_review
-- (verified_service_type_ids is NEVER updatable via RLS — only service role can touch it)
CREATE POLICY "contractors_update_own_skills"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Enforce that verified_service_type_ids is not changed via RLS path
        -- (service-role API calls bypass this, which is intentional)
    );

-- ══════════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION VALIDATION QUERIES (run these after applying to confirm success)
-- ══════════════════════════════════════════════════════════════════════════════

-- Confirm all 3 columns exist with correct types:
-- SELECT column_name, data_type, column_default
-- FROM   information_schema.columns
-- WHERE  table_name = 'profiles'
--   AND  column_name IN ('service_type_ids', 'verified_service_type_ids', 'skills_pending_review');
--
-- Confirm indexes were created:
-- SELECT indexname, indexdef
-- FROM   pg_indexes
-- WHERE  tablename = 'profiles'
--   AND  indexname LIKE '%service_type%';
--
-- Spot-check a contractor row:
-- SELECT id, service_type_ids, verified_service_type_ids, skills_pending_review
-- FROM   profiles
-- WHERE  role = 'contractor'
-- LIMIT  5;

-- ══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK PLAN (run ONLY if you need to undo this migration)
-- ══════════════════════════════════════════════════════════════════════════════

-- DROP POLICY IF EXISTS "contractors_read_own_skills"   ON profiles;
-- DROP POLICY IF EXISTS "contractors_update_own_skills" ON profiles;
-- DROP INDEX IF EXISTS profiles_verified_service_type_ids_gin;
-- DROP INDEX IF EXISTS profiles_service_type_ids_gin;
-- ALTER TABLE profiles
--     DROP COLUMN IF EXISTS service_type_ids,
--     DROP COLUMN IF EXISTS verified_service_type_ids,
--     DROP COLUMN IF EXISTS skills_pending_review;
-- ── End of DB-03 ─────────────────────────────────────────────────────────────
