/**
 * Approximate-location map for contractors.
 *
 * Before a contractor presses "On My Way" they must not learn the customer's street address.
 * To still help them plan the route we show a map with a circle of about 1 mile.
 *
 * Privacy rules this file enforces:
 *  - The circle is NOT centered on the customer's home. The center is moved by a pseudo-random
 *    offset (up to 0.7 mi) so the home is always inside the circle but never at its middle.
 *  - The offset comes from an HMAC keyed with LOCATION_BLUR_SECRET (a server-only secret).
 *    This repository is public, so without a secret anyone could redo the math and undo the offset.
 *  - The offset depends on the ADDRESS, not on the booking id. A repeat customer always gets the
 *    same circle, so a contractor cannot intersect several circles to close in on the home.
 *  - The real coordinates and the real address never leave the server from here: only an image URL
 *    that contains the moved center is returned.
 *  - Coordinates are never stored (Mapbox terms only allow storing results of its permanent
 *    geocoding product). They are looked up each time the job is opened.
 *
 * Fails closed: if anything is missing or fails, it returns null and the page just shows no map.
 */

import { createHmac } from 'crypto';

const MILE_M = 1609.344;
export const APPROX_RADIUS_MILES = 1;
const MAX_OFFSET_FRACTION = 0.7; // home is at most 0.7 mi from the circle's center
const CIRCLE_POINTS = 48;
const MAP_ZOOM = 11.5; // zoomed out: the 1-mile circle with a wide view of the surroundings

export interface ApproxMap {
    imageUrl: string;
    radiusMiles: number;
}

interface AddressParts {
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
}

type LngLat = { lng: number; lat: number };

async function geocode(query: string, zip: string | null, secretToken: string, postcodeOnly: boolean): Promise<LngLat | null> {
    const types = postcodeOnly ? 'postcode' : 'address';
    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?access_token=${secretToken}&country=us&limit=1&types=${types}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    const center = feature?.center;
    if (!Array.isArray(center) || center.length < 2) return null;

    // When we know the ZIP, make sure Mapbox did not wander off to another one.
    if (zip && !postcodeOnly) {
        const ctx: Array<{ id?: string; text?: string }> = feature.context ?? [];
        const found = ctx.find((c) => typeof c.id === 'string' && c.id.startsWith('postcode'));
        if (found && found.text !== zip) return null;
    }

    const [lng, lat] = center as [number, number];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
}

function blurCenter(real: LngLat, addressKey: string, secret: string): LngLat {
    const h = createHmac('sha256', secret).update(addressKey).digest();
    const u1 = h.readUInt32BE(0) / 2 ** 32;
    const u2 = h.readUInt32BE(4) / 2 ** 32;
    const angle = 2 * Math.PI * u1;
    const dist = MAX_OFFSET_FRACTION * APPROX_RADIUS_MILES * MILE_M * Math.sqrt(u2);
    const dLat = (dist * Math.cos(angle)) / 111_320;
    const dLng = (dist * Math.sin(angle)) / (111_320 * Math.cos((real.lat * Math.PI) / 180));
    return { lng: real.lng + dLng, lat: real.lat + dLat };
}

function circleFeature(center: LngLat) {
    const r = APPROX_RADIUS_MILES * MILE_M;
    const coords: [number, number][] = [];
    for (let i = 0; i <= CIRCLE_POINTS; i++) {
        const a = (2 * Math.PI * i) / CIRCLE_POINTS;
        const dLat = (r * Math.cos(a)) / 111_320;
        const dLng = (r * Math.sin(a)) / (111_320 * Math.cos((center.lat * Math.PI) / 180));
        coords.push([Number((center.lng + dLng).toFixed(5)), Number((center.lat + dLat).toFixed(5))]);
    }
    return {
        type: 'Feature',
        properties: { stroke: '#D0B078', 'stroke-width': 3, fill: '#D0B078', 'fill-opacity': 0.2 },
        geometry: { type: 'Polygon', coordinates: [coords] },
    };
}

export async function getApproxMap(parts: AddressParts): Promise<ApproxMap | null> {
    try {
        const blurSecret = process.env.LOCATION_BLUR_SECRET;
        const secretToken = process.env.MAPBOX_SECRET_TOKEN;
        const publicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!blurSecret || blurSecret.length < 16 || !secretToken || !publicToken) return null;

        const address = (parts.address ?? '').trim();
        const zip = (parts.zip ?? '').trim() || null;
        if (!address && !zip) return null;

        const query = address && zip && !address.includes(zip) ? `${address}, ${zip}` : address || (zip as string);

        let real = address ? await geocode(query, zip, secretToken, false) : null;
        // Fallback: center of the ZIP code. Less exact, and still safe to show.
        if (!real && zip) real = await geocode(zip, zip, secretToken, true);
        if (!real) return null;

        const addressKey = `${address.toLowerCase().replace(/\s+/g, ' ')}|${zip ?? ''}`;
        const center = blurCenter(real, addressKey, blurSecret);
        const overlay = encodeURIComponent(JSON.stringify(circleFeature(center)));
        const imageUrl =
            `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/geojson(${overlay})/` +
            `${center.lng.toFixed(5)},${center.lat.toFixed(5)},${MAP_ZOOM}/640x400@2x?access_token=${publicToken}`;

        return { imageUrl, radiusMiles: APPROX_RADIUS_MILES };
    } catch {
        return null;
    }
}
