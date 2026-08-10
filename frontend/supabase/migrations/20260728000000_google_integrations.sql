-- Create google_auth_tokens table to persist OAuth 2.0 tokens for Search Console, Analytics, & Business Profile APIs
CREATE TABLE IF NOT EXISTS public.google_auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT UNIQUE NOT NULL DEFAULT 'default',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scope TEXT,
    token_type TEXT DEFAULT 'Bearer',
    id_token TEXT,
    expiry_date BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy: Only service role / authenticated admin can manage tokens
ALTER TABLE public.google_auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to google_auth_tokens"
    ON public.google_auth_tokens
    FOR ALL
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
