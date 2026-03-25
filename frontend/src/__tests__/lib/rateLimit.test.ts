// Mock next/server before importing rateLimit (which imports NextRequest type)
jest.mock('next/server', () => ({}))

// Mock upstash so we always use the in-memory fallback in tests
jest.mock('@upstash/ratelimit', () => ({}))
jest.mock('@upstash/redis', () => ({}))

import { rateLimit } from '@/lib/rateLimit'

function makeReq(ip: string): { headers: { get(name: string): string | null } } {
  return {
    headers: {
      get(name: string) {
        if (name === 'x-forwarded-for') return ip
        return null
      },
    },
  }
}

describe('rateLimit (in-memory fallback)', () => {
  const windowMs = 60_000
  const maxRequests = 5

  it('allows the first request', async () => {
    const req = makeReq('1.1.1.1')
    const blocked = await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-first' })
    expect(blocked).toBe(false)
  })

  it('allows requests under the limit', async () => {
    const req = makeReq('2.2.2.2')
    for (let i = 0; i < maxRequests; i++) {
      const blocked = await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-under' })
      expect(blocked).toBe(false)
    }
  })

  it('blocks the 6th request when limit is 5', async () => {
    const req = makeReq('3.3.3.3')
    for (let i = 0; i < maxRequests; i++) {
      await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-over' })
    }
    const blocked = await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-over' })
    expect(blocked).toBe(true)
  })

  it('separate IP + identifier combos have independent limits', async () => {
    const req1 = makeReq('4.4.4.4')
    const req2 = makeReq('5.5.5.5')

    for (let i = 0; i < maxRequests; i++) {
      await rateLimit(req1, { maxRequests, windowMs, keyPrefix: 'test-sep', identifier: 'a@test.com' })
    }
    // req1 is now at limit
    const blocked1 = await rateLimit(req1, { maxRequests, windowMs, keyPrefix: 'test-sep', identifier: 'a@test.com' })
    expect(blocked1).toBe(true)

    // req2 different IP — should still be allowed
    const blocked2 = await rateLimit(req2, { maxRequests, windowMs, keyPrefix: 'test-sep', identifier: 'a@test.com' })
    expect(blocked2).toBe(false)
  })

  it('same IP different identifier is separately rate-limited', async () => {
    const req = makeReq('6.6.6.6')

    for (let i = 0; i < maxRequests; i++) {
      await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-diff-id', identifier: 'user1@test.com' })
    }
    const blocked1 = await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-diff-id', identifier: 'user1@test.com' })
    expect(blocked1).toBe(true)

    // Different identifier on same IP — separate bucket
    const blocked2 = await rateLimit(req, { maxRequests, windowMs, keyPrefix: 'test-diff-id', identifier: 'user2@test.com' })
    expect(blocked2).toBe(false)
  })
})
