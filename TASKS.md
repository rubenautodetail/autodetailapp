# Rubens Auto Detail Platform — Task Tracker

**Last Updated:** 2026-03-16 (sprint 2)
**Status Legend:** ✅ Done | 🔄 In Progress | ⏳ Pending | ❌ Blocked

---

## Sprint: Production Hardening (Mar 13–16, 2026)

### 🔐 Security & Auth

| # | Task | Status | Notes |
|---|---|---|---|
| S-01 | Fix SQL injection via unsanitized `.or()` bookingId | ✅ Done | Sanitized in approve, webhook, capture routes |
| S-02 | Fix middleware bypass on `/en/admin/bookings` | ✅ Done | `isBookingRoute` now uses locale-aware regex |
| S-03 | Clear booking sessionStorage on logout | ✅ Done | AuthContext.logout() clears `rubens_booking_state` |
| S-04 | Redact Stripe internal errors from API responses | ✅ Done | approve, capture, create-with-payment routes |
| S-05 | Add client-side admin role guard to admin pages | ✅ Done | Already in admin/layout.tsx — role check + spinner |
| S-06 | Add input validation to contractor register route | ✅ Done | Validate email/name/phone; `any` cast removed |
| S-07 | Add request body size limit to API routes | ✅ Done | content-length 10 MB check in register route |
| S-08 | Create `lib/env.ts` startup validation | ✅ Done | `validateEnv()` called from health route |

### 🌐 Internationalization

| # | Task | Status | Notes |
|---|---|---|---|
| I-01 | Fix hardcoded `/en/` links in customer dashboard | ✅ Done | Now uses `locale` from `useParams()` |
| I-02 | Fix hardcoded `/en/` in contractor notification links | ✅ Done | capture + onboard routes — now locale-agnostic paths |
| I-03 | Full i18n audit — find all remaining hardcoded EN strings | ✅ Done | Fixed dashboard/request/page.tsx; 0 remaining in pages |

### 🐛 Bug Fixes

| # | Task | Status | Notes |
|---|---|---|---|
| B-01 | Null safety in booking/review page (`selectedService?.name`) | ✅ Done | `useEffect` redirect guards before render |
| B-02 | `Number(b.total_amount)` can produce NaN in dashboard | ✅ Done | `parseFloat(String(...)) \|\| 0` in dashboard/page.tsx |
| B-03 | `failureMessage` unused var in webhook | ✅ Done | Variable IS used in `console.warn` — false alarm |
| B-04 | Add error state to admin bookings page on fetch failure | ✅ Done | `fetchError` state + red banner in admin/bookings |

### 📦 Infrastructure

| # | Task | Status | Notes |
|---|---|---|---|
| P-01 | Sentry installed and configured | ✅ Done | Needs `NEXT_PUBLIC_SENTRY_DSN` in Vercel env |
| P-02 | Security headers (CSP, HSTS, X-Frame) | ✅ Done | In `next.config.ts` |
| P-03 | Vercel cron jobs (auto-approve, job-expiry) | ✅ Done | `vercel.json` configured |
| P-04 | Silent contractor notification failure alerting | ✅ Done | `Sentry.captureException` in create-with-payment |

---

## Sprint: Feature Completion (Mar 6–11, 2026)

| # | Feature | Status | Notes |
|---|---|---|---|
| F-01 | Full 6-step booking flow | ✅ Done | select→location→schedule→review→payment→confirmation |
| F-02 | Contractor lifecycle (register→pending→approve→work) | ✅ Done | Full flow + admin approval |
| F-03 | Admin panel (bookings, users, payments, contractors) | ✅ Done | All pages + API routes |
| F-04 | Stripe Connect onboarding | ✅ Done | onboard + onboarding-status routes |
| F-05 | Contractor dashboard with realtime | ✅ Done | Supabase realtime + audio alert |
| F-06 | Customer dashboard with realtime | ✅ Done | UPDATE subscription on bookings |
| F-07 | Contractor earnings page | ✅ Done | `/contractor/earnings` with payout breakdown |
| F-08 | Review system | ✅ Done | UI + server-side validated API |
| F-09 | 24hr auto-approve cron | ✅ Done | `/api/cron/auto-approve` |
| F-10 | HyGraph CMS for landing page | ✅ Done | Hero + Testimonials |
| F-11 | Auth enforcement (no guest access) | ✅ Done | Middleware + all API routes |
| F-12 | Booking data not cleared on logout | ✅ Done | Fixed in AuthContext |

---

## Backlog (Not Started)

### High Priority Before Launch

| # | Task | Priority | Est. |
|---|---|---|---|
| PS-06 | RLS policy audit on Supabase tables | ✅ Done | All 7 tables RLS enabled + policies applied via API |
| DB-01 | Run `approval_status` + `user_id` migrations | ✅ Done | Applied via Supabase Management API |
| DB-02 | Create `contractor-docs` storage bucket (private) | ✅ Done | Created via Storage API — private, 10 MB limit |
| E-01 | `reviews` table + RLS | ✅ Done | Table created + unique index + RLS policies applied |

### Medium Priority

| # | Task | Priority | Est. |
|---|---|---|---|
| S-05 | Client-side admin role guard (middleware already protects) | 🟡 Medium | 1h |
| S-07 | Request body size limit for register multipart | 🟡 Medium | 30min |
| I-03 | Full i18n audit — grep remaining hardcoded EN strings | 🟡 Medium | 2h |
| PS-01 | Lighthouse audit all pages — target 90+ | 🟡 Medium | 4h |
| PS-02 | SEO: sitemap.xml, robots.txt, Open Graph meta tags | ✅ Done | sitemap.ts + robots.ts + full OG in [lang]/layout.tsx |
| PS-03 | Mobile responsiveness audit (375px → 428px) | ✅ Done | Reduced py-24/py-20 to py-14/py-12 on mobile (landing + contractors pages); h1 text-4xl on xs |
| PS-07 | Stripe webhook idempotency handling | ✅ Done | Status-based guards on all 4 webhook handlers |
| WH-01 | Admin alert email when chargeback dispute opened | ✅ Done | sendChargebackAlertEmail() wired in webhook |

### Low Priority / Nice to Have

| # | Task | Priority | Est. |
|---|---|---|---|
| PS-04 | CI/CD pipeline — GitHub Actions | 🟢 Low | 3h |
| PS-05 | Load testing with k6 | 🟢 Low | 4h |
| E-03 | Contractor preferred language for notification links | 🟢 Low | 1h |
| E-04 | Confirmation code via session state instead of URL param | 🟢 Low | 30min |

### DB Migrations (Run Once in Supabase SQL Editor)

```sql
-- Required if not already applied:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status text
    CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;
-- Create contractor-docs storage bucket (private) in Supabase Dashboard:
--   Storage → New bucket → Name: "contractor-docs" → Public: OFF
```

---

## Environment Variables Checklist

| Variable | Where | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Required |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Required |
| `STRIPE_SECRET_KEY` | Server only | Required |
| `STRIPE_WEBHOOK_SECRET` | Server only | Required |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Frontend | Required |
| `SERVICE_ZIP_CODES` | Server only | Optional (empty = serve all) |
| `PLATFORM_FEE_PERCENTAGE` | Server only | Default: 15 |
| `CRON_SECRET` | Server only | Required for cron jobs |
| `ADMIN_API_SECRET` | Server only | Required for capture route |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend | ⚠️ Add to Vercel |
| `SENTRY_AUTH_TOKEN` | Build only | Optional (source maps) |
| `SENTRY_ORG` | Build only | Optional |
| `SENTRY_PROJECT` | Build only | Optional |
| `HYGRAPH_ENDPOINT` | Server only | For landing page CMS |
| `HYGRAPH_TOKEN` | Server only | For landing page CMS |
| `RESEND_API_KEY` | Server only | For email notifications |
| `UPSTASH_REDIS_REST_URL` | Server only | Rate limiting (falls back to in-memory if missing) |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | Rate limiting (falls back to in-memory if missing) |

---

## Audit History

| Date | Type | Grade | Key Findings |
|---|---|---|---|
| 2026-03-16 | Sprint 2 — tasks implementation | A (95/100) | S-05–08, I-02–03, PS-02, PS-07, WH-01 all done |
| 2026-03-16 | Full code audit + bug fix sprint | A- (90/100) | S-06, B-02, B-04, I-02, P-04, S-08 all fixed |
| 2026-03-13 | Full production audit | B+ (83/100) | 4 critical fixed (injection, error leak, logout, middleware bypass) |
| 2026-03-13 | Route availability test | Pass | 35/35 routes responding correctly |

---

*This document is the source of truth for all work done and pending on the platform.*
