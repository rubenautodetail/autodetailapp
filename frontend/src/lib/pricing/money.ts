import { PricingInputError } from './types';

/** Converts a database decimal to cents without binary floating-point math. */
export function decimalToCents(value: string | number): number {
  const decimal = String(value).trim();
  const match = /^\+?(\d+)(?:\.(\d+))?$/.exec(decimal);
  if (!match) {
    throw new PricingInputError(`Invalid money value: ${decimal}`, 'INVALID_PRICE');
  }

  const whole = BigInt(match[1]);
  const fraction = match[2] ?? '';
  const firstTwo = (fraction + '00').slice(0, 2);
  let cents = whole * BigInt(100) + BigInt(firstTwo);

  // Legacy NUMERIC values with more than two places are rounded half-up, exactly.
  if (fraction.length > 2 && Number(fraction[2]) >= 5) {
    cents += BigInt(1);
  }

  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PricingInputError('Money value exceeds the supported range', 'INVALID_PRICE');
  }

  return Number(cents);
}

export function formatCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new PricingInputError('Invalid cents value', 'INVALID_PRICE');
  }
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function centsToDollars(cents: number): number {
  return Number(formatCents(cents));
}
