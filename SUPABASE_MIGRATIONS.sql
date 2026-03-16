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
