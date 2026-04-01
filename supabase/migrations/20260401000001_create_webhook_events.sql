-- Idempotency table for Stripe webhook events.
-- Ensures each Stripe event is processed exactly once, even on retries.
CREATE TABLE IF NOT EXISTS webhook_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id text    NOT NULL,
    type        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT webhook_events_stripe_event_id_key UNIQUE (stripe_event_id)
);

-- Index for fast idempotency lookups on every incoming webhook
CREATE INDEX IF NOT EXISTS webhook_events_stripe_event_id_idx
    ON webhook_events (stripe_event_id);
