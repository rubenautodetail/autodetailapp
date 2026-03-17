-- Add banking/payment detail columns to profiles.
-- These are collected during contractor registration and shown in the admin detail modal.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS zelle_contact       text,      -- phone or email used for Zelle
    ADD COLUMN IF NOT EXISTS bank_name           text,
    ADD COLUMN IF NOT EXISTS bank_account_number text,
    ADD COLUMN IF NOT EXISTS bank_routing_number text,
    ADD COLUMN IF NOT EXISTS bank_account_type   text;      -- 'checking' | 'savings'
