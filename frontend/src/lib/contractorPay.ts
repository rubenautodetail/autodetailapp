/**
 * Technician pay. Server-side only: import this from API routes, never from
 * client components, so the percentage never reaches the technician's browser.
 */
export const CONTRACTOR_SHARE = 0.70;

/** What the technician earns for a given customer amount, rounded to cents. */
export function contractorAmount(customerAmount: number): number {
    return Math.round((Number(customerAmount) || 0) * CONTRACTOR_SHARE * 100) / 100;
}
