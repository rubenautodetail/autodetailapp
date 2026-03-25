-- Ensure idempotency at the database level
ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_stripe_event_id_key UNIQUE (stripe_event_id);
