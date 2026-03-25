import type { SupabaseClient } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  role: 'user' | 'contractor' | 'admin'
  approval_status: string | null
}

/**
 * Fetch the profile for a given user ID.
 * Returns null if not found or on error.
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, approval_status')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'admin'
}

export function isContractor(profile: UserProfile | null): boolean {
  return profile?.role === 'contractor'
}

export function isUser(profile: UserProfile | null): boolean {
  return profile?.role === 'user'
}

export function isApprovedContractor(profile: UserProfile | null): boolean {
  return profile?.role === 'contractor' && profile?.approval_status === 'approved'
}
