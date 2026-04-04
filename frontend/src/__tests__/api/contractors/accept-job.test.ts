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
  createAuthClient: jest.fn(),
  createServiceClient: jest.fn(),
}))

jest.mock('@/lib/supabase/logBookingEvent', () => ({
  logBookingEvent: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/notifications', () => ({
  notify: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/contractors/accept-job/route'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

function makeRequest(body: Record<string, unknown>, token?: string) {
  const { NextRequest } = jest.requireMock('next/server')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new NextRequest('http://localhost/api/contractors/accept-job', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })
}

function mockAuth(user: { id: string } | null, error: unknown = null) {
  (createAuthClient as jest.Mock).mockResolvedValue({
    user,
    error,
  })
}

function mockServiceClient(opts: {
  approvalStatus?: string;
  booking?: Record<string, unknown> | null;
  updatedBooking?: Record<string, unknown> | null;
  updateError?: { code: string; message: string } | null;
} = {}) {
  const {
    approvalStatus = 'approved',
    booking = { id: 1, status: 'pending_assignment', contractor_id: null, customer_email: 'c@test.com' },
    updatedBooking = { id: 1, status: 'confirmed', contractor_id: 'contractor-1' },
    updateError = null,
  } = opts

  const profileSingle = jest.fn().mockResolvedValue({ data: { approval_status: approvalStatus } })
  const bookingSingle = jest.fn().mockResolvedValue({ data: booking })
  const updateSingle = jest.fn().mockResolvedValue({ data: updatedBooking, error: updateError })
  const contractorSingle = jest.fn().mockResolvedValue({ data: { full_name: 'Contractor Joe', phone_number: '3055551234' } })

  const fromMock = jest.fn().mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: profileSingle,
          }),
        }),
      }
    }
    if (table === 'bookings') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: bookingSingle,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: updateSingle,
                }),
              }),
            }),
          }),
        }),
      }
    }
    return {}
  })

  ;(createServiceClient as jest.Mock).mockReturnValue({
    from: fromMock,
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: { email: 'contractor@test.com' } } }),
      },
    },
  })
}

describe('POST /api/contractors/accept-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(makeRequest({ bookingId: '1' }))
    expect(res.status).toBe(401)
    expect((res.body as unknown as Record<string, string>).error).toMatch(/authentication/i)
  })

  it('accepts valid job acceptance', async () => {
    mockAuth({ id: 'contractor-1' })
    mockServiceClient()

    const res = await POST(makeRequest({ bookingId: '1' }, 'valid-token'))
    expect(res.status).toBe(200)
    expect((res.body as unknown as Record<string, unknown>).success).toBe(true)
  })
})
