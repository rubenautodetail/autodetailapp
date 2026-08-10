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

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(),
}))

jest.mock('@/lib/verifyAdmin', () => ({
  verifyAdmin: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    products: {
      create: jest.fn().mockResolvedValue({ id: 'prod_test123' }),
      update: jest.fn().mockResolvedValue({ id: 'prod_test123' }),
    },
    prices: {
      create: jest.fn().mockResolvedValue({ id: 'price_test123' }),
    },
  },
}))

import { POST } from '@/app/api/admin/services/route'
import { createServiceClient } from '@/lib/supabase/server'

function makeRequest(body: Record<string, unknown>) {
  const { NextRequest } = jest.requireMock('next/server')
  return new NextRequest('http://localhost/api/admin/services', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function mockServiceClient(data: Record<string, unknown> | null = null) {
  const singleResult = data ?? { id: 1, name: 'Test Service', base_price: 100 }
  ;(createServiceClient as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: singleResult, error: null }),
        }),
      }),
    }),
  })
}

describe('POST /api/admin/services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-apply verifyAdmin mock after clearAllMocks
    const { verifyAdmin } = jest.requireMock('@/lib/verifyAdmin')
    ;(verifyAdmin as jest.Mock).mockResolvedValue(true)
  })

  it('rejects missing name with 400', async () => {
    mockServiceClient()

    const res = await POST(makeRequest({ base_price: '100' }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/name/i)
  })

  it('rejects missing base_price with 400', async () => {
    mockServiceClient()

    const res = await POST(makeRequest({ name: 'Test Service' }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/base_price/i)
  })

  it('creates service with valid fields', async () => {
    mockServiceClient()

    const res = await POST(makeRequest({
      name: 'Full Detail',
      base_price: '149.99',
      description: 'Complete interior and exterior detail',
    }))
    expect(res.status).toBe(200)
    expect((res.body as unknown as Record<string, unknown>).data).toBeDefined()
  })
})
