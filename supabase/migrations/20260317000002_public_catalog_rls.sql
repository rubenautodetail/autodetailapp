-- Allow unauthenticated (anon) users to read active services and add-ons.
-- Without this, the booking service-selection page gets 0 rows back (RLS
-- silently filters everything when no matching policy exists).

DROP POLICY IF EXISTS "Services are publicly readable" ON services;
CREATE POLICY "Services are publicly readable"
    ON services
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Add-ons are publicly readable" ON add_ons;
CREATE POLICY "Add-ons are publicly readable"
    ON add_ons
    FOR SELECT
    USING (is_active = true);
