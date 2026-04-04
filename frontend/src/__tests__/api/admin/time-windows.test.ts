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

import { POST } from '@/app/api/admin/time-windows/route'

function makeRequest(body: Record<string, unknown>) {
  const { NextRequest } = jest.requireMock('next/server')
  return new NextRequest('http://localhost/api/admin/time-windows', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/time-windows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAdmin } = jest.requireMock('@/lib/verifyAdmin')
    ;(verifyAdmin as jest.Mock).mockResolvedValue(true)
  })

  it('rejects missing range with 400', async () => {
    const res = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      range_es: '9:00 AM',
      sort_order: 1,
    }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/range/i)
  })

  it('rejects missing range_es with 400', async () => {
    const res = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      range: '9:00 AM',
      sort_order: 1,
    }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/range.*spanish/i)
  })

  it('rejects missing sort_order with 400', async () => {
    const res = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      range: '9:00 AM',
      range_es: '9:00 AM',
    }))
    expect(res.status).toBe(400)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/sort_order/i)
  })
})
