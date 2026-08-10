import { decimalToCents, formatCents } from '@/lib/pricing';

describe('pricing money', () => {
  it.each([
    ['0', 0],
    ['12', 1200],
    ['12.3', 1230],
    ['12.34', 1234],
    ['12.345', 1235],
    ['999999.99', 99999999],
  ])('parses %s exactly as integer cents', (value, expected) => {
    expect(decimalToCents(value)).toBe(expected);
  });

  it('does not accept malformed or negative money values', () => {
    expect(() => decimalToCents('-1.00')).toThrow(/invalid money/i);
    expect(() => decimalToCents('12 dollars')).toThrow(/invalid money/i);
  });

  it('formats cents without arithmetic rounding', () => {
    expect(formatCents(12345)).toBe('123.45');
  });
});
