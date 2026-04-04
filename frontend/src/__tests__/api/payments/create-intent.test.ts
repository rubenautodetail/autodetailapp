// Mock external deps before any imports
jest.mock('next/server', () => {
  class MockNextRequest {
    private _body: unknown
    headers: Map<string, string>
    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this._body = init?.body ? JSON.parse(init.body) : {}
      this.headers = new Map(Object.entries(init?.headers ?? {}))
    }
    async json() { return this._body }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json(body: unknown, init?: { status?: number }) {
        return { body, status: init?.status ?? 200 }
      },
    },
  }
})

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn().mockResolvedValue(false),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createServiceClient: jest.fn(),
}))

jest.mock('@/lib/stripe/server', () => ({
  createPaymentIntent: jest.fn(),
}))

jest.mock('@upstash/ratelimit', () => ({}))
jest.mock('@upstash/redis', () => ({}))

import { POST } from '@/app/api/payments/create-intent/route'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/stripe/server'

function makeRequest(body: Record<string, unknown>) {
  const { NextRequest } = jest.requireMock('next/server')
  return new NextRequest('http://localhost/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Helper: configure Supabase auth mock
function mockAuth(user: { id: string } | null) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  })
}

// Helper: configure service client mock
function mockServiceClient(booking: Record<string, unknown> | null = null) {
  const single = jest.fn().mockResolvedValue({ data: booking })
  const eq2 = jest.fn().mockReturnValue({ single })
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
  const select = jest.fn().mockReturnValue({ eq: eq1 })
  const updateEq2 = jest.fn().mockResolvedValue({})
  const updateEq1 = jest.fn().mockReturnValue({ eq: updateEq2 })
  const update = jest.fn().mockReturnValue({ eq: updateEq1 })

  ;(createServiceClient as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({ select, update }),
  })
}

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects temp_booking bookingId with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ bookingId: 'temp_booking_abc', amount: 5000 }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/temporary booking/i)
  })

  it('rejects zero amount with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ bookingId: 'booking-1', amount: 0 }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/invalid amount/i)
  })

  it('rejects negative amount with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ bookingId: 'booking-1', amount: -100 }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/invalid amount/i)
  })

  it('rejects unauthenticated requests with 401', async () => {
    mockAuth(null)

    const res = await POST(makeRequest({ bookingId: 'booking-1', amount: 5000 }))
    expect(res.status).toBe(401)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/authentication/i)
  })

  it('creates payment intent for valid request', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient({ customer_email: 'test@example.com', total_amount: 50 })
    ;(createPaymentIntent as jest.Mock).mockResolvedValue({
      clientSecret: 'pi_secret_123',
      paymentIntentId: 'pi_123',
      amount: 5000,
    })

    const res = await POST(makeRequest({ bookingId: 'booking-1', amount: 5000 }))
    expect(res.status).toBe(200)
    expect((res.body as unknown as Record<string, unknown>).success).toBe(true)
    expect((res.body as unknown as Record<string, unknown>).clientSecret).toBe('pi_secret_123')
    expect(createPaymentIntent).toHaveBeenCalledTimes(1)
  })
})
