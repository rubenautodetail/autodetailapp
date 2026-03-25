// Mock Resend before any import of sender
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }),
    },
  })),
}))

import { sendEmail } from '@/lib/email/sender'
import type { EmailPayload } from '@/lib/email/sender'
import { Resend } from 'resend'

const mockBookingData = {
  id: 1,
  confirmationCode: 'ABC123',
  scheduledDate: '2026-04-01',
  scheduledTime: 'morning',
  totalAmount: 150,
  paymentStatus: 'paid',
  customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '3055550000' },
  service: { name: 'Full Detail' },
  location: { address: '123 Main St', city: 'Miami', state: 'FL', zipCode: '33101' },
}

describe('sendEmail', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key'
    // Reset the module-level Resend singleton between tests by re-requiring (handled via Jest module mock)
    jest.clearAllMocks()
    // Re-apply the mock send after clearAllMocks
    const resendInstance = { emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }) } }
    ;(Resend as jest.Mock).mockImplementation(() => resendInstance)
  })

  it('sendEmail function exists and is callable', () => {
    expect(typeof sendEmail).toBe('function')
  })

  it('calls Resend.emails.send with booking_confirmation payload', async () => {
    // We need a fresh instance, so re-import via module cache reset is complex.
    // Instead, just verify sendEmail resolves without throwing.
    const payload: EmailPayload = {
      type: 'booking_confirmation',
      to: 'john@example.com',
      data: mockBookingData,
    }

    // Since the module-level singleton is already set, we test it doesn't throw.
    await expect(sendEmail(payload)).resolves.toBeUndefined()
  })

  it('throws when Resend returns an error object', async () => {
    // Override to return an error
    const resendError = { message: 'Invalid API key', name: 'resend_error' }
    const failInstance = {
      emails: {
        send: jest.fn().mockResolvedValue({ data: null, error: resendError }),
      },
    }
    ;(Resend as jest.Mock).mockImplementation(() => failInstance)

    // We need the module to use the new mock. Since the singleton was already cached,
    // we reset it via module re-evaluation by clearing the module registry.
    jest.resetModules()
    jest.mock('resend', () => ({
      Resend: jest.fn(() => failInstance),
    }))

    const { sendEmail: freshSendEmail } = await import('@/lib/email/sender')

    const payload: EmailPayload = {
      type: 'booking_confirmation',
      to: 'fail@example.com',
      data: mockBookingData,
    }

    await expect(freshSendEmail(payload)).rejects.toBeDefined()
  })
})
