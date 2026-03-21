# Rubens Auto Detail Platform — Implementation Plan

**Last Updated:** 2026-03-16
**Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Stripe Connect, Resend, HyGraph
**Repo root:** `/Users/othmarcasilla/Rubens Auto detail platfomr/`
**Frontend root:** `./frontend/`

---

## Platform Overview

Bilingual (EN/ES) mobile car detailing marketplace with three user roles:

| Role | Entry Point | Key Pages |
|---|---|---|
| **Customer** | `/[lang]` → `/[lang]/booking/select` | Dashboard, Booking flow, Receipt, Review |
| **Contractor** | `/[lang]/contractors` → `/[lang]/contractor/dashboard` | Dashboard, Jobs, Earnings, Settings |
| **Admin** | `/[lang]/admin` | Bookings, Users, Payments, Contractors, Services |

---

## Architecture

```
Browser
  └── Next.js 16 (App Router) — /frontend
        ├── /app/[lang]/           — UI pages (bilingual)
        ├── /app/api/              — Server API routes (no Strapi)
        ├── /contexts/             — AuthContext, BookingContext (React Context only)
        ├── /lib/
        │     ├── supabase/        — server.ts (createClient, createServiceClient, createAuthClient)
        │     ├── stripe/          — server.ts (createPaymentIntent, capturePaymentIntent, verifyWebhookSignature)
        │     ├── email.ts         — Resend email helpers
        │     ├── env.ts           — Startup env var validation
        │     └── rateLimit.ts     — Upstash Redis rate limiter
        └── /components/           — UI component library

External Services
  ├── Supabase          — Auth, PostgreSQL, Realtime, Storage (contractor docs)
  ├── Stripe Connect    — PaymentIntents (manual capture), Express accounts
  ├── Resend            — Transactional email
  ├── HyGraph           — Landing page CMS (Hero + Testimonials)
  ├── Mapbox            — Address autocomplete
  └── Sentry            — Error monitoring
```

---

## Database Tables (Supabase)

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | Users + contractors | `id`, `role`, `approval_status`, `stripe_account_id`, `onboarding_complete` |
| `bookings` | All bookings | `id`, `status`, `payment_status`, `payment_intent_id`, `contractor_id`, `user_id`, `confirmation_code` |
| `services` | Service catalog | `id`, `name`, `price`, `description` |
| `add_ons` | Booking add-ons | `id`, `name`, `price` |
| `vehicles` | Customer vehicles | `id`, `user_id`, `make`, `model`, `year` |
| `notifications` | In-app alerts | `id`, `user_id`, `type`, `title`, `message`, `booking_id`, `is_read`, `link` |

### Booking Status Flow

```
pending_payment → pending_assignment → confirmed → in_progress → completed
                                    ↘ cancelled
```

### Payment Status Flow

```
unpaid → authorized (card held) → paid (captured)
                                ↘ failed
```

---

## Customer Flow

1. **Select service** — `/[lang]/booking/select` — Choose service + add-ons from Supabase catalog
2. **Location** — `/[lang]/booking/location` — ZIP validation + Mapbox address autocomplete
3. **Schedule** — `/[lang]/booking/schedule` — Real availability (contractor count − existing bookings)
4. **Review** — `/[lang]/booking/review` — Contact info + vehicle + booking summary
5. **Payment** — `/[lang]/booking/payment` — Stripe PaymentElement (card hold, manual capture)
6. **Confirmation** — `/[lang]/booking/confirmation` — Confirmation code + receipt link

**API:** `POST /api/booking/create-with-payment` — atomic: creates booking + Stripe PaymentIntent in one request. Rolls back booking if Stripe fails.

---

## Contractor Flow

1. **Landing** — `/[lang]/contractors` — Public "Work with us" page
2. **Apply** — `/[lang]/contractors/apply` — Auth-required application form (uploads docs to `contractor-docs` bucket)
3. **Pending** — `/[lang]/contractor/pending` — Waiting for admin approval
4. **Dashboard** — `/[lang]/contractor/dashboard` — Realtime job queue, accept/claim jobs
5. **Active job** — `/[lang]/contractor/active` — Track active job
6. **Earnings** — `/[lang]/contractor/earnings` — Payout history with 15% platform fee breakdown
7. **Settings** — `/[lang]/contractor/settings` — Stripe Connect onboarding

**Stripe Connect:** Contractor needs `onboarding_complete=true` + `stripe_account_id` set.
**Payout:** 85% of total to contractor (auto-split via `transfer_data` on capture).

---

## Admin Flow

| Page | Route | Function |
|---|---|---|
| Dashboard | `/[lang]/admin` | Overview + links |
| Bookings | `/[lang]/admin/bookings` | List, filter, cancel, re-queue |
| Booking detail | `/[lang]/admin/bookings/[id]` | Full detail + approve + payment breakdown |
| Users | `/[lang]/admin/users` | Role management (user/contractor/admin) |
| Payments | `/[lang]/admin/payments` | Per-contractor earnings + platform fees |
| Contractors | `/[lang]/admin/contractors` | Approve/reject pending applications |
| Services | `/[lang]/admin/services` | CRUD service catalog + Stripe Products |

**Auth:** `ADMIN_API_SECRET` header for capture route. Middleware enforces `role=admin` on all `/admin/*` routes.
**Booking approval:** `POST /api/booking/approve` requires `confirmationCode` in body (prevents IDOR).

---

## Auth & Middleware

- **Supabase email/password** only (no OAuth)
- `frontend/src/middleware.ts` runs on all non-static routes
- `frontend/src/lib/supabase/proxy.ts` → `updateSession()` handles:
  - Session cookie refresh
  - `/booking/*` → requires any authenticated user
  - `/contractor/*` → requires `role=contractor`
  - `/admin/*` → requires `role=admin`
  - Locale injection: `/foo` → `/en/foo`

---

## Payment Integration (Stripe Connect)

```
Customer pays → PaymentIntent (manual capture, card hold 7 days)
Webhook: amount_capturable_updated → booking status = pending_assignment
Admin approves → POST /api/payments/capture → funds captured
Stripe routes 85% to contractor's Express account automatically
Webhook: payment_intent.succeeded → booking status = confirmed, payment_status = paid
```

**Key env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PLATFORM_FEE_PERCENTAGE=15`

---

## Email Notifications (Resend)

| Trigger | Template | Recipients |
|---|---|---|
| Booking created | Confirmation | Customer |
| Booking confirmed (authorized) | Confirmation + job alert | Customer + all contractors |
| Booking approved (captured) | Receipt | Customer |
| Payment failed | Failure notice | Customer |
| Contractor registered | Application received | Contractor + admin |
| Contractor approved/rejected | Status update | Contractor |

---

## Cron Jobs (Vercel)

| Job | Route | Schedule | Purpose |
|---|---|---|---|
| Auto-approve | `/api/cron/auto-approve` | Every hour | Capture bookings pending >24h |
| Job expiry | `/api/cron/expire-jobs` | Daily | Cancel unassigned jobs older than 48h |

Secured by `CRON_SECRET` header checked in each route.

---

## Rate Limiting

`POST /api/booking/create-with-payment` and `POST /api/payments/create-intent` are rate-limited to **5 req/min per IP** via Upstash Redis (`@upstash/ratelimit`).

---

## Error Monitoring (Sentry)

- Installed: `@sentry/nextjs` v10
- Configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `NEXT_PUBLIC_SENTRY_DSN` must be set in Vercel
- `Sentry.captureException` called on: contractor notification failures
- TODO: add to chargeback handler in webhook

---

## Key Rules (from CLAUDE.md — always follow these)

1. **All UI components** must accept `locale?: "en" | "es"` and handle both languages inline
2. **Routes:** `/[lang]/page-name` for frontend; `/api/...` for backend
3. **State:** React Context API only (`BookingContext`, `ContractorContext`) — no Zustand/Redux
4. **Supabase:** `createClient()` for user-context; `createServiceClient()` for admin/RLS bypass
5. **No `any` types** unless absolutely unavoidable (add ESLint disable comment + explanation)
6. **Mapbox** for addresses (`NEXT_PUBLIC_MAPBOX_TOKEN`), not Google Maps on new code

---

## Pre-Launch Checklist

### Must-Do Before Going Live

- [ ] Run DB migrations (approval_status + user_id columns) — see TASKS.md
- [ ] Create `contractor-docs` private bucket in Supabase Storage
- [ ] Verify `reviews` table exists in Supabase (or create it)
- [ ] Run Supabase RLS policy audit (PS-06 in TASKS.md)
- [ ] Set all required env vars in Vercel dashboard (see Environment Variables Checklist in TASKS.md)
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel
- [ ] Switch Stripe keys from test (`sk_test_...`) to live (`sk_live_...`)
- [ ] Register Stripe webhook endpoint in Stripe Dashboard pointing to `https://yourdomain.com/api/payments/webhook`
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set to the production domain
- [ ] Test full booking flow end-to-end on staging
- [ ] Test contractor onboarding flow end-to-end
- [ ] Test admin approve/reject flow

### Health Check

After deploy, hit `GET /api/health` — all checks should be `"ok"`. If `env` check is `"error"`, the `missingEnv` field lists exactly which vars are missing.

---

## File Reference

| What | Where |
|---|---|
| Task tracker | `TASKS.md` |
| This document | `IMPLEMENTATION_PLAN.md` |
| Architecture deep-dive | `ARCHITECTURE.md` |
| Stripe setup guide | `STRIPE_DEVELOPMENT_GUIDE.md` |
| HyGraph CMS setup | `HYGRAPH_SETUP.md` |
| Supabase client helpers | `frontend/src/lib/supabase/server.ts` |
| Stripe server helpers | `frontend/src/lib/stripe/server.ts` |
| Email helpers | `frontend/src/lib/email.ts` |
| Env validation | `frontend/src/lib/env.ts` |
| Middleware | `frontend/src/middleware.ts` + `frontend/src/lib/supabase/proxy.ts` |
| Booking context | `frontend/src/contexts/BookingContext.tsx` |
| Auth context | `frontend/src/contexts/AuthContext.tsx` |

---

## Enhancement Backlog (Post Mar 21, 2026)

Each item is additive — nothing here modifies existing working logic.
Starting point: contractor availability toggle (highest value / lowest risk).

---

### 🔴 Priority 1 — Contractor Availability Toggle
**Group:** Contractor side

**Why first:** `is_available` column exists in `profiles` but has no UI. Auto-assignment already filters by `is_available=true`, so without a toggle contractors have no way to go off-duty without admin intervention.

- [ ] `POST /api/contractor/availability` — toggle `is_available` on the authed contractor's profile
- [ ] Availability toggle UI on `/[lang]/contractor/dashboard` — pill switch, optimistic update, bilingual
- [ ] Show current status in contractor header/settings

**Files:** `frontend/src/app/api/contractor/availability/route.ts` (new), contractor dashboard page

---

### 🟡 Priority 2 — "Book Same Service Again" on Completed Cards
**Group:** Customer side

**Why:** One-tap rebook is the highest-conversion action on the history tab. Customer already trusts the service.

- [ ] "Book Again" button on completed `BookingCard` (below "Rate Your Service")
- [ ] Links to `/[lang]/booking/select?service=<serviceId>` — pre-selects the service on load
- [ ] Booking select page reads `?service` param and auto-highlights the matching card
- [ ] No backend changes needed

**Files:** `BookingCard.tsx`, `frontend/src/app/[lang]/booking/select/page.tsx`

---

### 🟡 Priority 3 — Loading Skeletons on Customer Dashboard
**Group:** Customer side

**Why:** The spinner is functional but skeletons feel instant — perceived performance improvement. Pure UI, zero logic change.

- [ ] `BookingCardSkeleton` component matching `BookingCard` layout and dimensions
- [ ] Replace `<Loader2>` spinner in `customer/page.tsx` with 4 skeleton cards in the grid
- [ ] No data or API changes

**Files:** `frontend/src/components/dashboard/BookingCard.tsx` (add skeleton export), `customer/page.tsx`

---

### 🟡 Priority 4 — Booking Receipt Page
**Group:** Customer side

**Why:** `/booking/[id]/receipt` route exists but content is likely a stub. Customers want a clean receipt they can screenshot or print.

- [ ] Check current state of `frontend/src/app/[lang]/booking/[id]/receipt/page.tsx`
- [ ] Display: order number, service name, date, contractor name, itemized price breakdown, payment status
- [ ] Print-friendly layout (white bg, clean typography)
- [ ] Link to it from the completed booking detail page sidebar

**Files:** `frontend/src/app/[lang]/booking/[id]/receipt/page.tsx`

---

### 🟡 Priority 5 — Contractor Earnings Summary Card
**Group:** Contractor side

**Why:** Contractors have no visibility into their income. Data already exists in `bookings`. Motivates retention.

- [ ] `GET /api/contractor/earnings/summary` — returns `{ totalEarned, pendingPayout, completedJobs, thisMonthEarned }` for authed contractor
- [ ] Summary card on contractor dashboard with 4 stat tiles
- [ ] Bilingual labels

**Files:** `frontend/src/app/api/contractor/earnings/summary/route.ts` (new), contractor dashboard page

---

### 🟡 Priority 6 — Admin Stats Bar on Bookings List
**Group:** Admin side

**Why:** Admin has zero at-a-glance visibility. No DB schema changes needed.

- [ ] `GET /api/admin/bookings/stats` — returns `{ todayCount, pendingAssignment, totalRevenue, completedThisMonth }`
- [ ] 4-tile stats bar at top of `/[lang]/admin/bookings`
- [ ] Bilingual

**Files:** `frontend/src/app/api/admin/bookings/stats/route.ts` (new), admin bookings list page

---

### 🟢 Priority 7 — React Error Boundaries
**Group:** Technical / zero risk

**Why:** An unhandled render error currently shows a blank white screen. Error boundary shows a recovery UI instead.

- [ ] `ErrorBoundary` component with "Something went wrong — go back" fallback UI
- [ ] Wrap `customer/layout.tsx` and `contractor/layout.tsx`
- [ ] Pure defensive addition — no logic change

**Files:** new `frontend/src/components/ErrorBoundary.tsx`, layout files

---

### 🟢 Priority 8 — Fix `BookingStatus` TypeScript Type
**Group:** Technical / zero risk

**Why:** `pending_assignment` is a real DB status set by the webhook, but it's missing from the `BookingStatus` union type. Results in silent `as BookingStatus` casts throughout the codebase.

- [ ] Add `'pending_assignment'` to `BookingStatus` in `StatusTimeline.tsx`
- [ ] Add `pending_assignment` entry to `statusConfig` in `BookingCard.tsx`
- [ ] Remove `as BookingStatus` cast on status mapping in `BookingStatusContext.tsx`

**Files:** `StatusTimeline.tsx`, `BookingCard.tsx`, `BookingStatusContext.tsx`

---

### Progress Tracker

| # | Group | Item | Status |
|---|---|---|---|
| 1 | Contractor | Availability toggle | ✅ Already implemented |
| 2 | Customer | Book same service again | ✅ Done |
| 3 | Customer | Loading skeletons | ✅ Done |
| 4 | Customer | Booking receipt page | ✅ Done |
| 5 | Contractor | Earnings summary card | ✅ Done |
| 6 | Admin | Stats bar on bookings list | ✅ Done |
| 7 | Technical | React error boundaries | ✅ Done |
| 8 | Technical | BookingStatus type fix | ✅ Done |
