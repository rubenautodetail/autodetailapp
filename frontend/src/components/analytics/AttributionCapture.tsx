'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/analytics/attribution';

/**
 * Saves the visitor's source (utm_* / gclid) when the page opens. Renders nothing.
 * Mounted once in the root layout.
 */
export default function AttributionCapture() {
    useEffect(() => {
        captureAttribution();
    }, []);
    return null;
}
