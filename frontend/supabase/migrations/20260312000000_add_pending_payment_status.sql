-- Migration: add pending_payment to bookings.status allowed values
--
-- The booking flow now uses status='pending_payment' as an intermediate state
-- between booking creation and Stripe payment authorization:
--
--   pending_payment  → created atomically with Stripe PaymentIntent (not yet authorized)
--   pending_assignment → card authorized by Stripe webhook; now visible to contractors
--   confirmed        → contractor accepted the job
--   in_progress      → contractor started the job
--   pending_approval → contractor marked complete; awaiting customer approval
--   completed        → customer approved or auto-approved after 24 hours
--   cancelled        → payment failed or booking cancelled
--
-- Run this in Supabase SQL Editor before deploying the booking/create-with-payment endpoint.

-- Step 1: Drop the existing check constraint (name may vary — check in Supabase Dashboard
--         under Table Editor → bookings → Constraints if this migration errors)
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Step 2: Recreate with all valid statuses including the new pending_payment
ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
        'pending_payment',
        'pending_assignment',
        'confirmed',
        'in_progress',
        'pending_approval',
        'completed',
        'cancelled'
    ));

-- Step 3: Also ensure payment_status allows 'disputed' (used by the webhook)
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings
    ADD CONSTRAINT bookings_payment_status_check
    CHECK (payment_status IN (
        'unpaid',
        'authorized',
        'paid',
        'failed',
        'refunded',
        'disputed'
    ));

-- Step 4: Add indexes for the queries we run most frequently
-- (safe to run multiple times — IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings (status);

CREATE INDEX IF NOT EXISTS idx_bookings_contractor_id
    ON bookings (contractor_id)
    WHERE contractor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON bookings (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id
    ON bookings (payment_intent_id)
    WHERE payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_approval
    ON profiles (role, approval_status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications (user_id, is_read);
