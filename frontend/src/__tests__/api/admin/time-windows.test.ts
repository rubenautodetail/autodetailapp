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

function mockSupabaseInsert() {
  const single = jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
  const select = jest.fn(() => ({ single }))
  const insert = jest.fn(() => ({ select }))
  const from = jest.fn(() => ({ insert }))
  const { createServiceClient } = jest.requireMock('@/lib/supabase/server')
  ;(createServiceClient as jest.Mock).mockReturnValue({ from })
  return { insert }
}

describe('POST /api/admin/time-windows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { verifyAdmin } = jest.requireMock('@/lib/verifyAdmin')
    ;(verifyAdmin as jest.Mock).mockResolvedValue(true)
  })

  // Since ad75823, missing ranges are not an error: the route falls back to the
  // labels so admins are never blocked by the optional display fields.
  it('defaults a missing range to the label', async () => {
    const { insert } = mockSupabaseInsert()
    const res = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      range_es: '9:00 AM',
      sort_order: 1,
    }))
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ range: '9 AM' }))
  })

  it('defaults a missing range_es to the Spanish label, then the English one', async () => {
    const { insert } = mockSupabaseInsert()
    const res = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      label_es: '9 de la mañana',
      range: '9:00 AM',
      sort_order: 1,
    }))
    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ range_es: '9 de la mañana' }))

    const { insert: insertNoEs } = mockSupabaseInsert()
    const resNoEs = await POST(makeRequest({
      slot: '09:00',
      label: '9 AM',
      range: '9:00 AM',
      sort_order: 1,
    }))
    expect(resNoEs.status).toBe(200)
    expect(insertNoEs).toHaveBeenCalledWith(expect.objectContaining({ range_es: '9 AM' }))
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
