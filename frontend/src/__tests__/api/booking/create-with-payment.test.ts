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

jest.mock('@/lib/qstash', () => ({
  getQStashClient: jest.fn(() => ({ publishJSON: jest.fn().mockResolvedValue({}) })),
  SITE_URL: 'http://localhost:3000',
}))

jest.mock('@/lib/notifications', () => ({
  notify: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

jest.mock('@upstash/ratelimit', () => ({}))
jest.mock('@upstash/redis', () => ({}))

import { POST } from '@/app/api/booking/create-with-payment/route'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/stripe/server'

const VALID_BODY = {
  date: '2026-05-01',
  timeWindow: 'morning',
  address: '123 Main Street',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  total: 150,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleYear: '2022',
  vehicleColor: 'White',
}

function makeRequest(body: Record<string, unknown>) {
  const { NextRequest } = jest.requireMock('next/server')
  return new NextRequest('http://localhost/api/booking/create-with-payment', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function mockAuth(user: { id: string } | null) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  })
}

function mockServiceClient(bookingRows: Record<string, unknown>[] | null = null) {
  const selectResult = bookingRows ?? [{ id: 1, confirmation_code: 'ABC123' }]
  const inMock = jest.fn().mockResolvedValue({})
  ;(createServiceClient as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: selectResult, error: null }),
      }),
      update: jest.fn().mockReturnValue({
        in: inMock,
      }),
      delete: jest.fn().mockReturnValue({
        in: inMock,
      }),
    }),
  })
}

describe('POST /api/booking/create-with-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects string total with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ ...VALID_BODY, total: 'abc' }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/invalid booking total/i)
  })

  it('rejects total <= 0 with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ ...VALID_BODY, total: -5 }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/invalid booking total/i)
  })

  it('creates booking for valid request', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()
    ;(createPaymentIntent as jest.Mock).mockResolvedValue({
      clientSecret: 'pi_secret_456',
      paymentIntentId: 'pi_456',
      amount: 15000,
    })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect((res.body as unknown as Record<string, unknown>).success).toBe(true)
    expect((res.body as unknown as Record<string, unknown>).confirmationCode).toBe('ABC123')
    expect((res.body as unknown as Record<string, unknown>).clientSecret).toBe('pi_secret_456')
    expect(createPaymentIntent).toHaveBeenCalledTimes(1)
  })
})
