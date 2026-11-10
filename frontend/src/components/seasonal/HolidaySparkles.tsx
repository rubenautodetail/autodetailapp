'use client';

import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Holiday effect for the home page: a soft golden glow and golden sparkles
 * that float down once and fade away.
 *
 * - Pure CSS animation, no images and no libraries.
 * - Shown only between HOLIDAY_START and HOLIDAY_END (local time, crosses the new year).
 *   Add ?holiday=1 to the URL to preview it on any date.
 * - Plays every time the home page loads, and never when the visitor asked for reduced motion.
 * - Starts after the page has loaded, so it never competes with the main content.
 * - pointer-events: none, so it can never block a click.
 *
 * To reuse next year, just change the two dates below.
 */
const HOLIDAY_START = { month: 12, day: 1 }; // December 1
const HOLIDAY_END = { month: 1, day: 5 }; // January 5 (inclusive, next year)
const TOTAL_MS = 15000;

interface Spark {
    style: CSSProperties;
    star: boolean;
}

function inSeason(now: Date): boolean {
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const afterStart = m > HOLIDAY_START.month || (m === HOLIDAY_START.month && d >= HOLIDAY_START.day);
    const beforeEnd = m < HOLIDAY_END.month || (m === HOLIDAY_END.month && d <= HOLIDAY_END.day);
    // The season crosses the new year, so it is "start OR end" instead of "start AND end".
    return afterStart || beforeEnd;
}

export default function HolidaySparkles() {
    const [sparks, setSparks] = useState<Spark[] | null>(null);

    useEffect(() => {
        const forced = new URLSearchParams(window.location.search).get('holiday') === '1';
        if (!forced && !inSeason(new Date())) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const start = window.setTimeout(() => {
            const mobile = window.innerWidth < 768;
            const count = mobile ? 22 : 46;
            const list: Spark[] = Array.from({ length: count }, () => {
                const star = Math.random() < 0.4;
                const s = star ? 10 + Math.random() * 14 : 3 + Math.random() * 5;
                return {
                    star,
                    style: {
                        '--s': `${s.toFixed(1)}px`,
                        '--x': `${(Math.random() * 100).toFixed(1)}vw`,
                        '--drift': `${(Math.random() * 90 - 45).toFixed(0)}px`,
                        '--d': `${(7 + Math.random() * 5).toFixed(1)}s`,
                        '--delay': `${(Math.random() * 5).toFixed(2)}s`,
                        '--tw': `${(1.1 + Math.random() * 1.4).toFixed(2)}s`,
                    } as CSSProperties,
                };
            });
            setSparks(list);
        }, 800);

        const end = window.setTimeout(() => setSparks(null), 800 + TOTAL_MS);
        return () => {
            window.clearTimeout(start);
            window.clearTimeout(end);
        };
    }, []);

    if (!sparks) return null;

    return (
        <div className="hs-layer" aria-hidden="true">
            <style>{CSS}</style>
            <div className="hs-glow" />
            {sparks.map((p, i) => (
                <span key={i} className={p.star ? 'hs-p hs-star' : 'hs-p hs-dot'} style={p.style} />
            ))}
        </div>
    );
}

const CSS = `
.hs-layer{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:45}
.hs-glow{position:absolute;left:-10%;right:-10%;top:-8vh;height:36vh;
  background:radial-gradient(ellipse at 25% 0%,rgba(241,220,166,.22),transparent 62%),radial-gradient(ellipse at 78% 0%,rgba(208,176,120,.18),transparent 64%);
  filter:blur(16px);opacity:0;animation:hs-glow 14s ease-in-out 0s 1 both}
@keyframes hs-glow{0%{opacity:0}18%{opacity:1}80%{opacity:1}100%{opacity:0}}
.hs-p{position:absolute;left:var(--x);top:-4vh;width:var(--s);height:var(--s);opacity:0;will-change:transform,opacity;
  animation:hs-fall var(--d) linear var(--delay) 1 both,hs-tw var(--tw) ease-in-out var(--delay) infinite}
.hs-dot{border-radius:50%;background:radial-gradient(circle,#fff6dc 0,#f1dca6 55%,rgba(208,176,120,0) 100%);box-shadow:0 0 8px 2px rgba(241,220,166,.55)}
.hs-star{background:#f6e3ae;filter:drop-shadow(0 0 6px rgba(241,220,166,.8));
  clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)}
@keyframes hs-fall{
  0%{transform:translate3d(0,0,0) rotate(0deg);opacity:0}
  10%{opacity:.95}
  85%{opacity:.9}
  100%{transform:translate3d(var(--drift),108vh,0) rotate(160deg);opacity:0}
}
@keyframes hs-tw{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5)}}
`;
