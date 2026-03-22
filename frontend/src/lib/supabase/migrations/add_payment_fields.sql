-- Add manual payment info fields to profiles table
-- Run in Supabase SQL Editor (Dashboard)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_preference text,        -- 'zelle' | 'direct_deposit'
  ADD COLUMN IF NOT EXISTS zelle_contact text,             -- phone or email for Zelle
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_routing_number text,
  ADD COLUMN IF NOT EXISTS bank_account_type text;         -- 'checking' | 'savings'
