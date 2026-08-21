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

jest.mock('@/lib/pricing', () => {
  const actual = jest.requireActual('@/lib/pricing')
  return { ...actual, resolveBookingPrice: jest.fn() }
})

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
import { resolveBookingPrice } from '@/lib/pricing'

const VALID_BODY = {
  date: '2026-05-01',
  timeWindow: 'morning',
  address: '123 Main Street',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  serviceId: 7,
  serviceName: 'Complete Detail',
  bodyStyle: 'sedan',
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
  const insertMock = jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({ data: selectResult, error: null }),
  })
  const client = {
    __insertMock: insertMock,
    from: jest.fn().mockReturnValue({
      insert: insertMock,
      update: jest.fn().mockReturnValue({
        in: inMock,
      }),
      delete: jest.fn().mockReturnValue({
        in: inMock,
      }),
    }),
  }
  ;(createServiceClient as jest.Mock).mockReturnValue(client)
  return client
}

describe('POST /api/booking/create-with-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(resolveBookingPrice as jest.Mock).mockResolvedValue({
      service: {
        id: 7,
        documentId: null,
        name: 'Complete Detail',
        basePriceCents: 15000,
        durationMinutes: 90,
      },
      addOns: [],
      vehicles: [{
        index: 0,
        bodyStyle: 'sedan',
        serviceId: 7,
        serviceName: 'Complete Detail',
        serviceDurationMinutes: 90,
        priceSource: 'base',
        servicePriceCents: 15000,
        addOns: [],
        addOnsPriceCents: 0,
        totalCents: 15000,
      }],
      subtotalCents: 15000,
      serviceFeeCents: 0,
      totalCents: 15000,
      totalDurationMinutes: 90,
      currency: 'usd',
      pricingRevision: `v1_${'a'.repeat(64)}`,
    })
  })

  it('rejects string total with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ ...VALID_BODY, total: 'abc' }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/validation failed/i)
  })

  it('rejects total <= 0 with 400', async () => {
    mockAuth({ id: 'user-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ ...VALID_BODY, total: -5 }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/validation failed/i)
  })

  it('creates booking for valid request', async () => {
    mockAuth({ id: 'user-1' })
    const client = mockServiceClient()
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
    expect(createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
      amount: 15000,
      customerId: 'user-1',
      metadata: {
        serviceId: '7',
        bodyStyleSummary: 'sedan:1',
        vehicleCount: '1',
        pricingRevision: `v1_${'a'.repeat(64)}`,
      },
    }))
    // Each booking row records ITS vehicle's own service from the quote line.
    const insertedRows = client.__insertMock.mock.calls[0][0] as Array<Record<string, unknown>>
    expect(insertedRows).toHaveLength(1)
    expect(insertedRows[0]).toMatchObject({ service_id: 7, service_name: 'Complete Detail' })
  })
})
