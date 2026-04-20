import { BookingCreateSchema, PriceCalculateSchema } from '@/lib/validation/booking'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const FUTURE_DATE = new Date(Date.now() + 86400 * 1000).toISOString()

const validBooking = {
  date: FUTURE_DATE,
  timeWindow: 'morning' as const,
  address: '123 Main Street',
  zipCode: '33101',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
}

describe('BookingCreateSchema', () => {
  it('passes with valid booking data', () => {
    const result = BookingCreateSchema.safeParse(validBooking)
    expect(result.success).toBe(true)
  })

  it('fails when date is missing', () => {
    const { date: _omit, ...rest } = validBooking
    const result = BookingCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('date')
    }
  })

  it('fails when customerEmail is missing', () => {
    const { customerEmail: _omit, ...rest } = validBooking
    const result = BookingCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('customerEmail')
    }
  })

  it('fails with a 4-digit ZIP code', () => {
    const result = BookingCreateSchema.safeParse({ ...validBooking, zipCode: '3310' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('zipCode')
    }
  })

  it('fails with letters in ZIP code', () => {
    const result = BookingCreateSchema.safeParse({ ...validBooking, zipCode: 'ABCDE' })
    expect(result.success).toBe(false)
  })

  it('fails with a past date', () => {
    const pastDate = new Date(Date.now() - 86400 * 1000).toISOString()
    const result = BookingCreateSchema.safeParse({ ...validBooking, date: pastDate })
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('date')
    }
  })

  it('fails with an invalid email', () => {
    const result = BookingCreateSchema.safeParse({ ...validBooking, customerEmail: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('customerEmail')
    }
  })

  it('fails with an invalid timeWindow value', () => {
    const result = BookingCreateSchema.safeParse({ ...validBooking, timeWindow: 'midnight' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('timeWindow')
    }
  })
})

describe('PriceCalculateSchema', () => {
  it('passes with a valid serviceId', () => {
    const result = PriceCalculateSchema.safeParse({ serviceId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it('passes with serviceId and valid addOnIds', () => {
    const result = PriceCalculateSchema.safeParse({
      serviceId: VALID_UUID,
      addOnIds: [VALID_UUID],
      zipCode: '90210',
    })
    expect(result.success).toBe(true)
  })

  it('fails when serviceId is missing', () => {
    const result = PriceCalculateSchema.safeParse({ addOnIds: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const keys = result.error.issues.map((i) => i.path[0])
      expect(keys).toContain('serviceId')
    }
  })

  it('accepts numeric string serviceId (Supabase PK)', () => {
    const result = PriceCalculateSchema.safeParse({ serviceId: '7' })
    expect(result.success).toBe(true)
  })

  it('fails when serviceId is empty', () => {
    const result = PriceCalculateSchema.safeParse({ serviceId: '' })
    expect(result.success).toBe(false)
  })
})
