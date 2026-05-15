-- Fix: infinite recursion in profiles RLS policies
-- Caused by "Admins can view all profiles" policy calling get_my_role()
-- which queries profiles, triggering the same policy → 500 on every login.

-- Drop all conflicting SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "contractors_read_own_skills" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- SECURITY DEFINER function bypasses RLS for role lookup (no recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS
$$ SELECT role FROM public.profiles WHERE id = user_id; $$;

-- Single clean SELECT policy
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');
