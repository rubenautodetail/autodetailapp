# Production Audit Report — Rubens Auto Detail Platform

**Date:** March 17, 2026
**Auditor:** Claude (5 parallel agents)
**Scope:** Full-stack security, auth, Stripe, Supabase, TypeScript, 46 API routes
**Build Status:** PASSES — zero TypeScript errors

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 7 | Must fix before production |
| HIGH | 4 | Fix within 1 week |
| MEDIUM | 8 | Fix within 2 weeks |
| LOW | 3 | Backlog |

**Overall Score: 6.8/10** — Auth flow is solid after today's fixes. Main gaps are in data isolation (contractors can see all bookings), payment amount validation, and missing profile auto-creation.

---

## CRITICAL ISSUES (7)

### CRIT-01: Contractor Sees ALL Bookings (Data Leak)
- **File:** `frontend/src/contexts/ContractorContext.tsx` ~line 75
- **Bug:** Fetches `.from('bookings').select('*')` with NO `contractor_id` filter
- **Impact:** Every contractor sees every customer's name, address, phone, price
- **Fix:** Add `.eq('contractor_id', profile.id)` to the query
- **Also affects:** Real-time subscription (line ~104) and `updateStatus` mutation (line ~127)

### CRIT-02: Contractor Can Update ANY Booking
- **File:** `frontend/src/contexts/ContractorContext.tsx` ~line 127
- **Bug:** `.from('bookings').update({...}).eq('id', id)` — no ownership check
- **Impact:** Contractor A can mark Contractor B's job as complete
- **Fix:** Add `.eq('contractor_id', profile.id)` to the update query

### CRIT-03: Real-Time Subscription Leaks All Data
- **File:** `frontend/src/contexts/ContractorContext.tsx` ~line 104
- **Bug:** Subscribes to ALL booking changes with `event: '*'`
- **Impact:** Real-time updates broadcast every booking to every contractor
- **Fix:** Filter subscription to `contractor_id=eq.${userId}`

### CRIT-04: `/payments/update-intent` Has No Auth
- **File:** `frontend/src/app/api/payments/update-intent/route.ts`
- **Bug:** No `getUser()` check — anyone can modify payment intent metadata
- **Impact:** Attacker can change `bookingId` on payment intents, breaking audit trail
- **Fix:** Add `createClient()` + `getUser()` auth check

### CRIT-05: Payment Amount Is Client-Controlled
- **File:** `frontend/src/app/api/payments/create-intent/route.ts`
- **Bug:** Amount passed directly from request body to Stripe, no server-side validation
- **Impact:** Customer can charge $0.01 instead of $500 by modifying the request
- **Fix:** Fetch booking from DB, validate `amount === booking.total_amount`

### CRIT-06: `/auth/webhook` Missing Signature Verification
- **File:** `frontend/src/app/api/auth/webhook/route.ts`
- **Bug:** Webhook secret check is commented out
- **Impact:** Spoofed Supabase auth events could trigger fake notifications
- **Fix:** Uncomment and enforce `SUPABASE_WEBHOOK_SECRET` validation

### CRIT-07: New Users Have No Profile Row
- **File:** `frontend/src/contexts/AuthContext.tsx` (register function)
- **Bug:** `signUp()` creates auth user but does NOT create a `profiles` row
- **Impact:** New users have `profile = null` after signup — middleware can't check role, login may hang
- **Fix:** Either add a Supabase auth trigger (`on auth.users insert → create profile`) or insert the profile row in the register function after signup

---

## HIGH ISSUES (4)

### HIGH-01: Stripe Connect — BY DESIGN
- **Decision:** All funds captured to platform account. Contractor payouts are handled manually outside of Stripe.
- **Status:** ✅ Closed — not a gap.

### HIGH-02: 8 Admin API Routes Missing Error Handling
- **Routes:** `/admin/bookings/detail`, `/admin/bookings/list`, `/admin/contractors/{approve,reject,list}`, `/admin/payments/list`, `/admin/stats`, `/auth/callback`
- **Bug:** Missing try/catch blocks — uncaught errors return 500 with stack traces
- **Fix:** Wrap each route handler in try/catch with proper JSON error responses

### HIGH-03: Middleware Crashes on Missing Profile
- **File:** `frontend/src/lib/supabase/proxy.ts` ~line 130
- **Bug:** `.single()` throws if no profile row exists (ties into CRIT-07)
- **Fix:** Add null check on profile before accessing `role`/`approval_status`

### HIGH-04: Customer Login Silently Redirects Wrong Roles
- **File:** `frontend/src/app/[lang]/(auth)/login/page.tsx` ~line 54
- **Bug:** If admin logs in at `/login`, they're silently redirected to `/admin` — no error shown
- **Recommendation:** Each portal login should ONLY allow its own role. Show "access denied" for others.

---

## MEDIUM ISSUES (8)

### MED-01: Guest Booking Payment Bypass
- **File:** `/api/booking/create-with-payment/route.ts`
- **Bug:** "Optional authentication — allow guest bookings" — no verified user required
- **Fix:** Require authentication for all bookings (aligned with Omar's "no guest access" rule)

### MED-02: `/payments/calculate-fees` Unauthenticated
- **File:** `/api/payments/calculate-fees/route.ts`
- **Bug:** No auth check; anyone can enumerate fee structure
- **Fix:** Add auth check

### MED-03: 7-Day PaymentIntent Void Not Monitored
- **Files:** `/api/cron/auto-approve/route.ts`, `lib/stripe/server.ts`
- **Bug:** If cron stops, bookings >7 days old lose their Stripe hold silently
- **Fix:** Add daily alert for bookings in `pending_approval` >6 days

### MED-04: Missing Error Boundaries
- **Scope:** All page layouts (booking, contractor, admin)
- **Bug:** Client-side errors crash the entire page instead of showing fallback UI
- **Fix:** Add React error boundary components to each layout

### MED-05: Non-Null Assertions in Supabase Clients
- **File:** `frontend/src/lib/supabase/server.ts`
- **Bug:** `process.env.NEXT_PUBLIC_SUPABASE_URL!` — silently fails if env var missing
- **Fix:** Add explicit null checks with descriptive error messages

### MED-06: Unused Zustand Dependency
- **Files:** `package.json`, `frontend/src/lib/store/booking.ts`
- **Bug:** Zustand imported but never used (project uses Context API)
- **Fix:** Remove `zustand` from dependencies and delete the store file

### MED-07: Booking Pages Lack Loading States
- **Pages:** `/booking/select`, `/booking/location`, `/booking/schedule`
- **Bug:** No explicit loading fallback while BookingContext initializes
- **Fix:** Add loading states before context data is available

### MED-08: Payment Webhook Race Condition
- **File:** `/api/payments/webhook/route.ts`
- **Bug:** Duplicate webhook events can arrive before DB writes complete
- **Mitigation:** Existing `.eq('payment_status', 'unpaid')` guard helps but isn't bulletproof
- **Fix:** Add idempotency check using Stripe event ID

---

## LOW ISSUES (3)

### LOW-01: Weak Confirmation Code Generation
- **File:** `/api/booking/create-with-payment/route.ts`
- **Bug:** 6-char code with `Math.random()` — ~32 bits entropy
- **Fix:** Use `crypto.getRandomValues()` for 12+ char codes

### LOW-02: CRON_SECRET Not Rate-Limited
- **File:** `/api/cron/auto-approve/route.ts`
- **Bug:** No rate limiting on cron endpoint
- **Fix:** Add rate limiter or use Vercel Cron signature verification

### LOW-03: Cron Logs Expose Environment Values
- **Files:** `/api/cron/auto-approve/route.ts`, `/api/cron/job-expiry/route.ts`
- **Bug:** Console logs contain `process.env` values visible in production logs
- **Fix:** Remove or sanitize console output

---

## WHAT'S WORKING WELL

- **Auth middleware** — properly protects all routes by role after today's fixes
- **Stripe webhook signature** — verified before processing events
- **Payment authorization hold** — `capture_method: 'manual'` prevents auto-charge
- **Idempotency keys** — prevent duplicate Stripe charges on retry
- **Booking rollback** — deletes booking if Stripe fails (no orphaned records)
- **Rate limiting** — implemented on payment and booking creation endpoints
- **Admin verification** — 3-tier auth (secret, cookie, JWT) on admin routes
- **TypeScript strict mode** — no `any` types found, build compiles clean
- **CSP headers** — properly configured in next.config.ts
- **Cron jobs** — auto-approve and job-expiry properly configured in vercel.json

---

## RECOMMENDED FIX ORDER

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | CRIT-01/02/03: ContractorContext data leak | 30 min | Blocks production |
| 2 | CRIT-07 + HIGH-03: Profile auto-creation | 30 min | Blocks new signups |
| 3 | CRIT-05: Server-side amount validation | 20 min | Prevents payment fraud |
| 4 | CRIT-04: Auth on update-intent | 15 min | Prevents payment tampering |
| 5 | CRIT-06: Webhook signature | 10 min | Prevents spoofed events |
| 6 | MED-01: Remove guest booking | 15 min | Aligns with auth policy |
| 7 | HIGH-02: Admin route error handling | 1 hr | Prevents 500 errors |
| 8 | HIGH-04: Login role isolation | 30 min | Prevents confusion |
| 9 | MED-04: Error boundaries | 1 hr | Better UX on errors |
| 10 | Everything else | 2-3 hrs | Polish |

---

## SUPABASE RLS RECOMMENDATION

The current setup relies on application-level filtering. For defense-in-depth, add these RLS policies in the Supabase Dashboard:

```sql
-- Contractors can only see their own bookings
CREATE POLICY "contractors_own_bookings" ON bookings
  FOR SELECT USING (contractor_id = auth.uid());

-- Contractors can only update their own bookings
CREATE POLICY "contractors_update_own" ON bookings
  FOR UPDATE USING (contractor_id = auth.uid());

-- Users can only see their own bookings
CREATE POLICY "users_own_bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can only see their own profile
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());
```

---

## ENVIRONMENT VARIABLES CHECKLIST

Verify these are set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Server-only |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |
| `STRIPE_SECRET_KEY` | Yes | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes | Yes |
| `RESEND_API_KEY` | Yes | Yes |
| `ADMIN_SECRET` | Yes | Yes |
| `CRON_SECRET` | Yes | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | No |
| `PLATFORM_FEE_PERCENTAGE` | Yes | Yes |
| `SERVICE_ZIP_CODES` | Yes | Yes |
| `HYGRAPH_ENDPOINT` | Optional | Yes |
| `HYGRAPH_TOKEN` | Optional | Yes |
| `SENTRY_DSN` | Optional | No |

---

*Report generated by 5 parallel audit agents scanning 46 API routes, all contexts, middleware, Stripe integration, and TypeScript build.*
