/**
 * Work zones for contractors. A booking's zone comes from its ZIP code; a
 * contractor only gets jobs (emails, dashboard, accepting) from the zones
 * the admin ticked for them.
 *
 * A ZIP that is not in any known zone returns null and is NOT filtered, so an
 * unknown area never silently loses a job.
 */

export const ZONES = ['miami-dade', 'broward'] as const;
export type ZoneId = (typeof ZONES)[number];

export const ZONE_LABELS: Record<ZoneId, { en: string; es: string }> = {
    'miami-dade': { en: 'Miami-Dade', es: 'Miami-Dade' },
    broward: { en: 'Broward', es: 'Broward' },
};

type Range = [number, number];

// Broward County ZIPs (Hollywood, Pembroke Pines, Miramar, Pompano, Fort Lauderdale, Coral Springs...).
const BROWARD: Range[] = [
    [33004, 33004], [33009, 33009], [33019, 33019], [33020, 33029],
    [33060, 33069], [33071, 33077], [33301, 33394], [33441, 33442],
];

// Miami-Dade County ZIPs (Hialeah, Homestead, Opa-locka, Miami, Miami Beach, Kendall, Doral...).
// 33036 and 33037 (Upper Keys) are Monroe County and are intentionally left out.
const MIAMI_DADE: Range[] = [
    [33010, 33018], [33030, 33035], [33039, 33039], [33054, 33058], [33101, 33299],
];

function inRanges(zip: number, ranges: Range[]): boolean {
    return ranges.some(([from, to]) => zip >= from && zip <= to);
}

/** The zone a ZIP belongs to, or null when it is outside the known zones. */
export function zoneForZip(zip: string | null | undefined): ZoneId | null {
    const clean = String(zip ?? '').trim().split('-')[0];
    if (!/^\d{5}$/.test(clean)) return null;
    const n = Number(clean);
    if (inRanges(n, BROWARD)) return 'broward';
    if (inRanges(n, MIAMI_DADE)) return 'miami-dade';
    return null;
}

/**
 * True when a contractor with these zones should get a job in this ZIP.
 * No zones set, or a ZIP outside the known zones, means "do not filter".
 */
export function contractorServesZip(
    zones: string[] | null | undefined,
    zip: string | null | undefined,
): boolean {
    const zone = zoneForZip(zip);
    if (!zone) return true;
    if (!zones || zones.length === 0) return true;
    return zones.includes(zone);
}
