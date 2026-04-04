-- Enable RLS on webhook_events table
-- Only service role (used by webhook handlers) should access this table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Block all access for non-service-role users
CREATE POLICY "webhook_events: service role only"
  ON webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);
