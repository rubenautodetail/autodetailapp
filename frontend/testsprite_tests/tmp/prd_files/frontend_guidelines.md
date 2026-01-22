# Frontend Development Guidelines
**Philosophy:** Premium, Mobile-First, & Vanilla CSS Power.

## 1. Tech Stack
*   **Framework:** Next.js 15+ (App Router).
*   **Styling:** **Vanilla CSS** with CSS Modules (`*.module.css`).
    *   *Why?* Maximum control, browser-native performance, no build-step overhead for styles.
    *   *Approach:* Use Modern CSS features (CSS Variables, Nesting, `@layer`, `clamp()` for fluid typography).
*   **State:** Zustand (Global), React Context (Theme/Auth).
*   **Icons:** `lucide-react` (Lightweight SVG icons).

## 2. Styling Strategy (The "Antigravity" Way)
We avoid generic utility classes. Every component has its own "Soul" (scoped CSS).

### A. CSS Variables (The Design System)
Defined in `app/globals.css`.
```css
:root {
  /* HSL Colors for Real-time Theming */
  --bg-primary: 220 15% 10%;
  --text-primary: 220 10% 98%;
  --accent-gold: 45 100% 50%;
  
  /* Fluid Typography */
  --font-h1: clamp(2rem, 5vw, 3.5rem);
  
  /* Spacing */
  --space-unit: 8px;
}
```

### B. Component Scoping
`components/Hero/Hero.tsx` -> `components/Hero/Hero.module.css`

```css
/* Hero.module.css */
.container {
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(var(--accent-gold), 0.1), transparent);
}
```

## 3. Mobile-First PWA Architecture
The web app must feel native.
1.  **Touch Targets:** All interactive elements must be `min-height: 44px`.
2.  **Navigation:** Use `BottomNav` component (fixed position bottom) for mobile, hidden on desktop.
3.  **Interactions:** Use `framer-motion` for slide-in "Sheet" drawers instead of standard web modals.
4.  **No Rubber-Banding:** `overscroll-behavior-y: none` on the body to prevent native browser pull-to-refresh effects unless intended.

## 4. Component Structure
```
frontend/
├── app/
│   ├── layout.tsx       # Global Shell (Providers)
│   ├── globals.css      # Variables & Reset
│   └── (routes)/...     # Page Logic
├── components/
│   ├── core/            # Atomic elements (Button, Input) w/ strict CSS encapsulation
│   ├── modules/         # Complex blocks (BookingWizard, Hero)
│   └── layout/          # MobileShell, BottomNav
└── lib/
    ├── api.ts           # Strictly typed fetchers
    └── store/           # Zustand stores
```
