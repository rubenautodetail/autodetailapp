'use client';

import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Halloween effect for the home page: a golden moon, fog and a swarm of bats
 * that fly out of the moon once and fade away.
 *
 * - Pure CSS animation, no images and no libraries.
 * - Shown only between HALLOWEEN_START and HALLOWEEN_END (local time).
 *   Add ?halloween=1 to the URL to preview it on any date.
 * - Plays every time the home page loads, and never when the visitor asked for reduced motion.
 * - Starts after the page has loaded, so it never competes with the main content.
 * - pointer-events: none, so it can never block a click.
 *
 * To reuse next year, just change the two dates below.
 */
const HALLOWEEN_START = { month: 10, day: 15 }; // October 15
const HALLOWEEN_END = { month: 10, day: 31 }; // October 31 (inclusive)
const TOTAL_MS = 16000;

interface Bat {
    style: CSSProperties;
}

function inSeason(now: Date): boolean {
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const afterStart = m > HALLOWEEN_START.month || (m === HALLOWEEN_START.month && d >= HALLOWEEN_START.day);
    const beforeEnd = m < HALLOWEEN_END.month || (m === HALLOWEEN_END.month && d <= HALLOWEEN_END.day);
    return afterStart && beforeEnd;
}

export default function HalloweenEffect() {
    const [bats, setBats] = useState<Bat[] | null>(null);
    const [moonSize, setMoonSize] = useState(200);

    useEffect(() => {
        const forced = new URLSearchParams(window.location.search).get('halloween') === '1';
        if (!forced && !inSeason(new Date())) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const start = window.setTimeout(() => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const mobile = W < 768;
            const size = mobile ? Math.min(W * 0.3, 120) : Math.min(W * 0.2, 220);
            const mx = W * 0.91 - size / 2;
            const my = H * 0.17 + size / 2;
            const count = mobile ? 12 : 26;

            const list: Bat[] = Array.from({ length: count }, () => {
                const s = Math.round((mobile ? 34 : 46) + Math.random() * (mobile ? 36 : 60));
                const ang = Math.PI * 0.62 + (Math.random() - 0.5) * Math.PI * 1.35;
                const R = W * (0.55 + Math.random() * 0.75);
                const x2 = mx + Math.cos(ang) * R;
                let y2 = my + Math.sin(ang) * R * (0.55 + Math.random() * 0.6);
                y2 = Math.max(-0.1 * H, Math.min(1.05 * H, y2));
                const xm = mx + (x2 - mx) * 0.5;
                const ym = my + (y2 - my) * 0.5 + (Math.random() * H * 0.18 - H * 0.09);
                const dir = x2 < mx ? -1 : 1;
                return {
                    style: {
                        '--s': `${s}px`,
                        '--dir': dir,
                        '--x0': `${mx - s / 2}px`,
                        '--y0': `${my - s * 0.3}px`,
                        '--xm': `${xm}px`,
                        '--ym': `${ym}px`,
                        '--x2': `${x2}px`,
                        '--y2': `${y2}px`,
                        '--k': (1 + Math.random() * 0.9).toFixed(2),
                        '--d': `${(6.5 + Math.random() * 4.5).toFixed(1)}s`,
                        '--delay': `${(1.2 + Math.random() * 5.5).toFixed(2)}s`,
                        '--b': `${(0.8 + Math.random() * 0.5).toFixed(2)}s`,
                        '--f': `${(0.17 + Math.random() * 0.12).toFixed(2)}s`,
                    } as CSSProperties,
                };
            });
            setMoonSize(size);
            setBats(list);
        }, 800);

        const end = window.setTimeout(() => setBats(null), 800 + TOTAL_MS);
        return () => {
            window.clearTimeout(start);
            window.clearTimeout(end);
        };
    }, []);

    if (!bats) return null;

    return (
        <div className="hw-layer" aria-hidden="true">
            <style>{CSS}</style>
            <div className="hw-fog" />
            <div className="hw-moon" style={{ width: moonSize, height: moonSize }} />
            {bats.map((b, i) => (
                <div key={i} className="hw-bat" style={b.style}>
                    <div className="hw-f">
                        <svg viewBox="0 0 100 60">
                            <path className="hw-wl" d="M50 30 C40 14 22 8 2 14 C10 20 12 28 16 34 C22 28 28 30 32 38 C38 32 44 34 50 40Z" />
                            <path className="hw-wr" d="M50 30 C60 14 78 8 98 14 C90 20 88 28 84 34 C78 28 72 30 68 38 C62 32 56 34 50 40Z" />
                            <ellipse cx="50" cy="34" rx="7" ry="11" />
                            <circle cx="50" cy="21" r="6.5" />
                            <path d="M45 17 L43 8 L49 14Z" />
                            <path d="M55 17 L57 8 L51 14Z" />
                            <circle className="hw-eye" cx="48" cy="21" r="1.3" />
                            <circle className="hw-eye" cx="52" cy="21" r="1.3" />
                        </svg>
                    </div>
                </div>
            ))}
        </div>
    );
}

const CSS = `
.hw-layer{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:45}
.hw-moon{position:absolute;right:9vw;top:17vh;border-radius:50%;
  background:radial-gradient(circle at 38% 36%,#fff6dc 0,#f1dca6 45%,#d9bd7d 100%);
  box-shadow:0 0 60px 20px rgba(241,220,166,.35),0 0 180px 80px rgba(208,176,120,.18);
  opacity:0;animation:hw-moon 15s ease-in-out 0s 1 both}
.hw-moon::before,.hw-moon::after{content:"";position:absolute;border-radius:50%;background:rgba(160,130,70,.22)}
.hw-moon::before{width:22%;height:22%;left:24%;top:30%}
.hw-moon::after{width:14%;height:14%;left:58%;top:56%}
@keyframes hw-moon{0%{opacity:0;transform:scale(.85)}12%{opacity:.95;transform:scale(1)}78%{opacity:.95}100%{opacity:0;transform:scale(1.05)}}
.hw-fog{position:absolute;left:-10%;right:-10%;bottom:-6vh;height:34vh;
  background:radial-gradient(ellipse at 20% 100%,rgba(190,200,255,.20),transparent 60%),radial-gradient(ellipse at 75% 100%,rgba(208,176,120,.16),transparent 62%);
  filter:blur(18px);opacity:0;animation:hw-fog 15s ease-in-out 0s 1 both}
@keyframes hw-fog{0%{opacity:0;transform:translateX(-4%)}20%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translateX(4%)}}
.hw-bat{position:absolute;left:0;top:0;width:var(--s);height:calc(var(--s)*.6);opacity:0;will-change:transform,opacity;
  animation:hw-swarm var(--d) cubic-bezier(.3,.1,.6,1) var(--delay) 1 both}
.hw-f{width:100%;height:100%;transform:scaleX(var(--dir))}
.hw-bat svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 0 7px rgba(208,176,120,.45));animation:hw-bob var(--b) ease-in-out infinite}
.hw-wl,.hw-wr{transform-box:fill-box;animation:hw-flap var(--f) ease-in-out infinite alternate}
.hw-wl{transform-origin:100% 60%}
.hw-wr{transform-origin:0% 60%;animation-name:hw-flap2}
@keyframes hw-flap{from{transform:rotate(-26deg) scaleY(1)}to{transform:rotate(18deg) scaleY(.68)}}
@keyframes hw-flap2{from{transform:rotate(26deg) scaleY(1)}to{transform:rotate(-18deg) scaleY(.68)}}
@keyframes hw-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
@keyframes hw-swarm{
  0%{transform:translate(var(--x0),var(--y0)) scale(.12);opacity:0}
  8%{opacity:.95}
  55%{transform:translate(var(--xm),var(--ym)) scale(calc(var(--k)*.7))}
  90%{opacity:.95}
  100%{transform:translate(var(--x2),var(--y2)) scale(var(--k));opacity:0}
}
.hw-bat path,.hw-bat ellipse,.hw-bat circle{fill:#1c2249;stroke:#D0B078;stroke-width:1.1;stroke-opacity:.9}
.hw-bat .hw-eye{fill:#ffcf7a;stroke:none}
@media (max-width:767px){.hw-moon{right:6vw;top:14vh}}
`;
