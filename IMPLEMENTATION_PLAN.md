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
