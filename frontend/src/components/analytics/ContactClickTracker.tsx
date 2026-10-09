'use client';

import { useEffect } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

/**
 * Sends a GA4 event whenever a visitor taps a phone or WhatsApp link anywhere on the site:
 *   click_call      → links starting with tel:
 *   click_whatsapp  → links to wa.me / api.whatsapp.com
 * Renders nothing. Mounted once in the root layout.
 */
export default function ContactClickTracker() {
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const link = target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href') ?? '';
            const params = {
                page_path: window.location.pathname,
                link_text: (link.textContent ?? '').trim().slice(0, 40),
            };

            if (href.startsWith('tel:')) {
                sendGAEvent('event', 'click_call', params);
            } else if (href.includes('wa.me/') || href.includes('api.whatsapp.com')) {
                sendGAEvent('event', 'click_whatsapp', params);
            }
        };

        document.addEventListener('click', onClick, { capture: true });
        return () => document.removeEventListener('click', onClick, { capture: true });
    }, []);

    return null;
}
