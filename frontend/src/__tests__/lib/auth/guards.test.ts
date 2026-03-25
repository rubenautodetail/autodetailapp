// guards.ts only imports from @supabase/supabase-js (type-only), safe to import directly
import { isAdmin, isContractor, isApprovedContractor } from '@/lib/auth/guards'
import type { UserProfile } from '@/lib/auth/guards'

describe('isAdmin', () => {
  it('returns true for admin role', () => {
    const profile: UserProfile = { id: '1', role: 'admin', approval_status: null }
    expect(isAdmin(profile)).toBe(true)
  })

  it('returns false for user role', () => {
    const profile: UserProfile = { id: '2', role: 'user', approval_status: null }
    expect(isAdmin(profile)).toBe(false)
  })

  it('returns false for null profile', () => {
    expect(isAdmin(null)).toBe(false)
  })
})

describe('isContractor', () => {
  it('returns true for contractor role', () => {
    const profile: UserProfile = { id: '3', role: 'contractor', approval_status: 'pending' }
    expect(isContractor(profile)).toBe(true)
  })

  it('returns false for admin role', () => {
    const profile: UserProfile = { id: '4', role: 'admin', approval_status: null }
    expect(isContractor(profile)).toBe(false)
  })

  it('returns false for null profile', () => {
    expect(isContractor(null)).toBe(false)
  })
})

describe('isApprovedContractor', () => {
  it('returns true for approved contractor', () => {
    const profile: UserProfile = { id: '5', role: 'contractor', approval_status: 'approved' }
    expect(isApprovedContractor(profile)).toBe(true)
  })

  it('returns false for pending contractor', () => {
    const profile: UserProfile = { id: '6', role: 'contractor', approval_status: 'pending' }
    expect(isApprovedContractor(profile)).toBe(false)
  })

  it('returns false for admin with approved status', () => {
    const profile: UserProfile = { id: '7', role: 'admin', approval_status: 'approved' }
    expect(isApprovedContractor(profile)).toBe(false)
  })

  it('returns false for null profile', () => {
    expect(isApprovedContractor(null)).toBe(false)
  })
})
