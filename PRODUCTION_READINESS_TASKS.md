# 🚀 Rubens Auto Detail Platform — Production Readiness Tasks

**Created:** February 17, 2026
**Overall Progress:** 45% → Target: 100%
**Target Completion:** March 17, 2026 (4 weeks)

---

## 📊 Progress Dashboard

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| **Week 1: Critical Blockers** | 11 | 0 | 0% |
| **Week 2: High Priority** | 8 | 0 | 0% |
| **Week 3-4: Polish & Scale** | 12 | 0 | 0% |
| **Total** | **31** | **0** | **0%** |

---

## 🔴 WEEK 1: CRITICAL BLOCKERS (Must Complete First)

### Day 1: Environment Configuration (2 hours)

#### Task 1.1: Configure Stripe API Keys ⏱️ 10 min
- [ ] Get Stripe publishable key from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- [ ] Add to `frontend/.env.local`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- [ ] Create webhook endpoint at [dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
  - [ ] Endpoint URL: `http://localhost:1337/api/payments/webhook`
  - [ ] Copy webhook secret to `backend/.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Get Stripe Connect Client ID from Settings → Connect
- [ ] Add to `backend/.env`: `STRIPE_CONNECT_CLIENT_ID=ca_...`
- [ ] Test payment intent creation with test card `4242 4242 4242 4242`

**Skills:** None (manual config)
**Verification:** ✅ Payment flow creates real payment intent

---

#### Task 1.2: Configure Google Maps API Key ⏱️ 15 min
- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create new project or select existing
- [ ] Enable APIs: Maps JavaScript API, Places API, Geocoding API
- [ ] Create API Key → Restrict to localhost + production domains
- [ ] Add to `frontend/.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...`
- [ ] Test map loads in location input page

**Skills:** None (manual config)
**Verification:** ✅ Google Maps components load without errors

---

#### Task 1.3: Generate Strapi API Token ⏱️ 5 min
- [ ] Open Strapi admin: `http://localhost:1337/admin`
- [ ] Settings → API Tokens → Create new token (Read-Only, Unlimited)
- [ ] Copy token to both vars in `frontend/.env.local`:
  - `NEXT_PUBLIC_STRAPI_API_TOKEN=...`
  - `STRAPI_API_TOKEN=...`
- [ ] Test API call from frontend to Strapi

**Skills:** None (manual config)
**Verification:** ✅ Frontend fetches services without 403 errors

---

#### Task 1.4: Fix Contractor Dashboard "use client" Bug ⏱️ 1 min
- [ ] Open `frontend/src/app/[lang]/contractor/dashboard/page.tsx`
- [ ] Add `"use client";` at line 1
- [ ] Test contractor dashboard loads

**Skills:** None (simple fix)
**Files:** 1 changed
**Verification:** ✅ Dashboard renders without React errors

---

#### Task 1.5: Fix Login Redirect Bug ⏱️ 1 min
- [ ] Open `frontend/src/app/[lang]/(auth)/login/page.tsx` line 31
- [ ] Change: `router.push("/dashboard")` → `router.push(\`/\${params.lang}/dashboard\`)`
- [ ] Test login redirects to `/en/dashboard`

**Skills:** None (simple fix)
**Files:** 1 changed
**Verification:** ✅ After login, user lands on localized dashboard

---

#### Task 1.6: E2E Booking Flow Test ⏱️ 90 min
- [ ] Start frontend (`npm run dev`) + backend (`npm run develop`)
- [ ] Complete full flow: ZIP → Service → Schedule → Review → Contact → Payment → Confirmation
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Verify booking created in Strapi admin
- [ ] Check console for errors

**Skills:** `@browser-extension-builder` (if using Playwright)
**Verification:** ✅ Full booking flow works without errors

---

### Day 2-3: Missing Pages & Data Architecture (8 hours)

#### Task 1.7: Build Booking Details Page (Vehicle + Address) ⏱️ 4 hours
- [ ] Create `frontend/src/app/[lang]/booking/details/page.tsx`
- [ ] Add form fields: Vehicle (Make, Model, Year, Color, Plate), Address (Google autocomplete), Special Instructions
- [ ] Update `BookingContext` to persist data
- [ ] Add navigation: Review → Details → Payment
- [ ] Update progress indicator (step 4 of 6)
- [ ] Add bilingual support (EN/ES)
- [ ] Test responsive design

**Skills:**
```bash
@brainstorming              # Plan component structure first
@react-component-builder    # Generate form component
@tailwind-patterns          # Styling
```

**Files:** 1 created, 2 modified
**Verification:** ✅ Can collect vehicle info and navigate to payment

---

#### Task 1.8: Fix Data Split — Unify Booking Storage ⏱️ 2 hours
- [ ] Refactor `frontend/src/app/[lang]/customer/dashboard/page.tsx`
- [ ] Remove Supabase query: `supabase.from("bookings")`
- [ ] Add Strapi API call: `fetch("${STRAPI_URL}/api/bookings?filters[customerEmail][$eq]=...")`
- [ ] Update TypeScript types for Strapi v5 format
- [ ] Test customer dashboard shows bookings

**Skills:**
```bash
@api-documenter             # Document API structure
@architecture               # Review data architecture decision
@code-documentation-doc-generate  # Inline comments
```

**Files:** 3 changed
**Verification:** ✅ Customer dashboard fetches from Strapi

---

#### Task 1.9: Wire Availability Checking to Real API ⏱️ 2 hours
- [ ] Open `frontend/src/app/[lang]/booking/schedule/page.tsx`
- [ ] Replace mock `isDateAvailable()` with real API call to `/api/booking/availability`
- [ ] Parse response: `{ availableDates: [{ date, slots }] }`
- [ ] Update calendar to show only available dates
- [ ] Add loading state + error handling
- [ ] Cache availability data

**Skills:**
```bash
@api-documenter             # Document availability API
@react-hooks                # Custom availability hook
```

**Files:** 1 changed
**Verification:** ✅ Calendar shows only dates with contractor availability

---

### Day 4-5: Contractor Assignment & Notifications (12 hours)

#### Task 1.10: Implement Contractor Assignment Algorithm ⏱️ 6 hours
- [ ] Create `backend/src/api/assignments/` folder structure
- [ ] Build assignment algorithm in `services/assignment-algorithm.ts`:
  - [ ] Find contractors covering ZIP
  - [ ] Check availability for date/time
  - [ ] Score by distance + rating + completion rate
  - [ ] Assign to highest-scoring contractor
- [ ] Trigger from payment webhook
- [ ] Update booking status: "confirmed"
- [ ] Update contractor availability: mark slot as booked
- [ ] Test with mock contractors

**Skills:**
```bash
@architect-review           # Review assignment algorithm
@architecture-decision-records  # Document assignment strategy (ADR)
@api-documenter             # Document assignment API
@code-documentation-doc-generate  # Inline comments
```

**Files:** 5 created
**Verification:** ✅ Booking auto-assigns contractor after payment

---

#### Task 1.11: Wire Up Notification System ⏱️ 3 hours
- [ ] Add email triggers for:
  - [ ] Booking confirmation (customer) — already exists line 594, test it
  - [ ] New job assigned (contractor)
  - [ ] Job starting soon (both) — cron job 1hr before
  - [ ] Job completed (both)
  - [ ] Payment received (contractor)
- [ ] Create email templates (HTML + text):
  - [ ] `booking-confirmation.html`
  - [ ] `new-job-assigned.html`
  - [ ] `job-starting-soon.html`
  - [ ] `job-completed.html`
  - [ ] `payment-received.html`
- [ ] Test Resend integration
- [ ] Add error logging (don't fail booking if email fails)

**Skills:**
```bash
@email-template-builder     # Generate email templates
@resend-api                 # Resend integration
@error-debugging-error-analysis  # Debug email failures
```

**Files:** 6 changed, 5 created
**Verification:** ✅ Emails sent at each booking lifecycle stage

---

#### Task 1.12: Fix Contractor Registration Endpoint ⏱️ 2 hours
- [ ] Add custom `/contractors/register` route in `backend/src/api/contractors/routes/contractor.ts`
- [ ] Create `register` method in controller:
  - [ ] Validate input
  - [ ] Create contractor with `status: 'pending'`
  - [ ] Send notification to admin
  - [ ] Send confirmation email to contractor
- [ ] Update frontend to use correct endpoint
- [ ] Test registration flow

**Skills:**
```bash
@api-documenter             # Document registration endpoint
@input-validation-patterns  # Validate input
```

**Files:** 3 changed
**Verification:** ✅ Contractor appears as "pending" in admin

---

#### Task 1.13: E2E Test with Real Stripe Payment ⏱️ 1 hour
- [ ] Complete booking flow with test card `4242 4242 4242 4242`
- [ ] Verify in Stripe dashboard: payment intent created, payment succeeded, 15% fee
- [ ] Verify in Strapi: booking status "confirmed", contractor assigned
- [ ] Test failure with declined card `4000 0000 0000 0002`
- [ ] Check webhook logs for errors

**Skills:**
```bash
@stripe-testing-patterns    # Test card scenarios
@error-debugging-error-analysis  # Debug payment failures
```

**Verification:** ✅ Real payment processes successfully end-to-end

---

## 🟠 WEEK 2: HIGH PRIORITY FEATURES

### Day 6-7: Contractor Payouts & Error Handling (6 hours)

#### Task 2.1: Build Stripe Connect Onboarding UI ⏱️ 3 hours
- [ ] Create `frontend/src/app/[lang]/contractor/settings/page.tsx`
- [ ] Add sections: Bank Account Status, Connect Button, Refresh Status, Payout Schedule
- [ ] Call `stripe.initiateOnboarding()` → redirects to Stripe
- [ ] Handle return with `?onboarding=complete` query param
- [ ] Show success/incomplete message
- [ ] Test with Stripe Connect test account

**Skills:**
```bash
@brainstorming              # Plan onboarding flow first
@stripe-connect-patterns    # Stripe Connect UI patterns
@react-component-builder    # Settings page
```

**Files:** 1 created
**Verification:** ✅ Contractor can connect bank account via Stripe

---

#### Task 2.2: Test Contractor Payout Flow ⏱️ 2 hours
- [ ] Complete test booking → assign contractor → mark complete
- [ ] Trigger payout in Stripe dashboard (manual)
- [ ] Verify transfer to contractor's connected account
- [ ] Verify 15% platform fee retained
- [ ] Check email notification sent

**Skills:** `@stripe-testing-patterns`
**Verification:** ✅ Payout transfers successfully

---

#### Task 2.3: Add Error Boundaries & Loading States ⏱️ 1 hour
- [ ] Create `frontend/src/app/error.tsx` (global)
- [ ] Create `frontend/src/app/[lang]/booking/error.tsx` (booking-specific)
- [ ] Add loading states: service selection, availability, payment, dashboards
- [ ] Add error states: API failures, network errors, payment failures
- [ ] Add skeleton loaders
- [ ] Test by stopping backend, using slow network

**Skills:**
```bash
@error-debugging-error-analysis  # Error handling patterns
@react-error-boundaries     # Error boundary best practices
@accessibility-compliance-accessibility-audit  # Accessible loading states
```

**Files:** 2 created, 8 changed
**Verification:** ✅ App handles errors gracefully without crashing

---

### Day 8-10: Customer & Contractor Profiles (12 hours)

#### Task 2.4: Build Contractor Earnings Page ⏱️ 4 hours
- [ ] Create `frontend/src/app/[lang]/contractor/earnings/page.tsx`
- [ ] Add backend: `GET /api/contractors/earnings` (totals, pending, payout history)
- [ ] Display: Overview cards, Earnings chart (Chart.js/Recharts), Payout history table, Export CSV
- [ ] Add filters: date range, status
- [ ] Bilingual support

**Skills:**
```bash
@react-component-builder    # Earnings page
@chartjs-integration        # Chart.js patterns
@api-documenter             # Document API
@tailwind-patterns          # Dashboard styling
```

**Files:** 2 created
**Verification:** ✅ Contractor views earnings breakdown

---

#### Task 2.5: Build Customer Profile Page ⏱️ 3 hours
- [ ] Create `frontend/src/app/[lang]/customer/profile/page.tsx`
- [ ] Sections: Personal info, Default address, Preferences, Account
- [ ] Backend: `GET/PUT/DELETE /api/customers/profile`
- [ ] Supabase `profiles` table + image upload (Supabase Storage)
- [ ] Validation: email, phone format
- [ ] Bilingual support

**Skills:**
```bash
@react-component-builder    # Profile form
@supabase-storage-patterns  # Image upload
@input-validation-patterns  # Validation
@tailwind-patterns          # Form styling
```

**Files:** 2 created
**Verification:** ✅ Customer updates profile + uploads photo

---

#### Task 2.6: Build Customer Vehicles Page ⏱️ 3 hours
- [ ] Create `frontend/src/app/[lang]/customer/vehicles/page.tsx`
- [ ] Backend: `GET/POST/PUT/DELETE /api/customers/vehicles`
- [ ] Vehicle list + Add vehicle modal
- [ ] Form: Make, Model, Year, Color, Plate, Set as Default
- [ ] Supabase `vehicles` table
- [ ] Bilingual support

**Skills:**
```bash
@react-component-builder    # Vehicles page
@supabase-crud-patterns     # CRUD integration
@modal-patterns             # Add vehicle modal
@tailwind-patterns          # Cards/table styling
```

**Files:** 2 created
**Verification:** ✅ Customer manages vehicles

---

#### Task 2.7: Integrate Vehicles into Booking Flow ⏱️ 2 hours
- [ ] Update `booking/details/page.tsx`
- [ ] Fetch saved vehicles (if authenticated)
- [ ] Vehicle dropdown + "Add New Vehicle" option
- [ ] Auto-select if only one vehicle
- [ ] Send `vehicleId` to backend
- [ ] Test: authenticated with/without vehicles, guest user

**Skills:**
```bash
@react-hooks                # Custom vehicle hook
@conditional-rendering      # Dropdown vs form
```

**Files:** 2 changed
**Verification:** ✅ Booking uses saved vehicles for returning customers

---

## 🟡 WEEK 3-4: POLISH & SCALE FEATURES

#### Task 3.1: Build Review & Rating System ⏱️ 8 hours
- [ ] Review form component
- [ ] Backend: `POST/GET/PUT/DELETE /api/reviews`
- [ ] Display on contractor profile
- [ ] Calculate aggregate rating
- [ ] Review moderation (admin approve/reject)
- [ ] Email contractor when reviewed
- [ ] Bilingual support

**Skills:**
```bash
@react-component-builder    # Review form
@api-documenter             # Document API
@moderation-patterns        # Review moderation
```

**Files:** 4 created
**Verification:** ✅ Customers submit reviews, see ratings

---

#### Task 3.2: Build Admin Dashboard MVP ⏱️ 20 hours
- [ ] Admin layout + auth guard (admin role only)
- [ ] Pages: Overview, Contractor Management, Booking Management, Revenue Analytics, Disputes
- [ ] Backend admin API routes (RBAC protected)
- [ ] Bilingual support

**Skills:**
```bash
@admin-dashboard-patterns   # Admin UI
@rbac-implementation        # Role-based access
@chartjs-integration        # Revenue charts
@architect-review           # Review admin architecture
@tailwind-patterns          # Admin UI styling
```

**Files:** 10+ created
**Verification:** ✅ Admin manages contractors + bookings + views analytics

---

#### Task 3.3: Real-time Booking Status Updates ⏱️ 6 hours
- [ ] Supabase Realtime subscriptions
- [ ] Subscribe to booking status changes (customer + contractor dashboards)
- [ ] Optimistic UI updates
- [ ] Toast notifications for status changes
- [ ] Test with multiple browser tabs

**Skills:**
```bash
@supabase-realtime-patterns # Realtime subscriptions
@websocket-patterns         # WebSocket fallback
```

**Files:** 4 changed
**Verification:** ✅ Status updates appear real-time without refresh

---

#### Task 3.4: Performance Optimization ⏱️ 4 hours
- [ ] Lighthouse audit (all pages)
- [ ] Optimize images (WebP, responsive sizes, lazy load)
- [ ] Code splitting (dynamic imports for maps, charts)
- [ ] API optimization (caching, SWR/React Query, deduplication)
- [ ] Database optimization (indexes, joins for N+1)
- [ ] Bundle size (remove unused deps, tree-shake, dynamic imports)
- [ ] Measure: Lighthouse 90+, bundle < 200KB, API < 200ms

**Skills:**
```bash
@web-performance-optimization  # Performance best practices
@lighthouse-audit           # Lighthouse automation
@bundle-analyzer            # Bundle analysis
@database-optimization      # Database performance
```

**Verification:** ✅ Lighthouse 90+, API < 200ms

---

#### Task 3.5: Comprehensive Documentation ⏱️ 4 hours
- [ ] Update `README.md` (overview, setup, env vars, deployment)
- [ ] Create `ARCHITECTURE.md` (diagrams, data flow, schemas, auth/payment flows)
- [ ] Create `API.md` (endpoints, examples, errors, rate limits)
- [ ] Create `DEPLOYMENT.md` (frontend/backend deploy, migrations, SSL, domain)
- [ ] Inline comments (complex algorithms, Stripe, webhooks)
- [ ] `CONTRIBUTING.md` (if open source)

**Skills:**
```bash
@docs-architect             # Comprehensive docs
@api-documenter             # API documentation
@c4-architecture-c4-architecture  # Architecture diagrams
@wiki-architect             # Wiki structure
```

**Files:** 5 created
**Verification:** ✅ New dev can set up from docs alone

---

#### Task 3.6: Security Audit ⏱️ 4 hours
- [ ] Run `npm audit`, fix vulnerabilities
- [ ] Scan for: SQL injection, XSS, CSRF, auth bypass, hardcoded secrets
- [ ] Add security headers (CSP, X-Frame-Options, HSTS)
- [ ] Rate limiting (API 100/min, login 5/15min, payment 10/hr)
- [ ] Input validation (Zod schemas, file uploads)
- [ ] Test with OWASP ZAP or Burp Suite
- [ ] Document in `SECURITY.md`

**Skills:**
```bash
@security-auditor           # Security audit
@owasp-top-10               # OWASP checklist
@api-security-best-practices  # API security
@production-code-audit      # Full security scan
```

**Verification:** ✅ Pass OWASP Top 10 compliance

---

#### Task 3.7: Load Testing ⏱️ 4 hours
- [ ] Set up k6 or Artillery
- [ ] Test scenarios: Booking creation (100 users), API endpoints (500 req/s), Dashboards (50 users), Payments (20 concurrent)
- [ ] Identify bottlenecks (DB pool, rate limits, memory leaks, slow queries)
- [ ] Optimize: caching (Redis), increase DB connections, optimize queries, CDN
- [ ] Re-test, document results

**Skills:**
```bash
@load-testing-patterns      # Load testing
@performance-testing-review-ai-review  # Performance analysis
@database-optimization      # Database tuning
```

**Verification:** ✅ System handles 500 req/s < 200ms

---

#### Task 3.8: CI/CD Pipeline Setup ⏱️ 3 hours
- [ ] GitHub Actions: `.github/workflows/ci.yml`
- [ ] CI: lint, type check, tests, coverage (80%+), security scan, build
- [ ] CD: deploy to Vercel (frontend), Railway (backend), migrations, Slack notify
- [ ] Branch protection: PR reviews, CI must pass
- [ ] Test with test PR

**Skills:**
```bash
@github-actions-workflow    # GitHub Actions
@vercel-deployment          # Vercel config
@docker-expert              # Docker (if needed)
```

**Files:** 2 created
**Verification:** ✅ CI/CD deploys on merge

---

#### Task 3.9: Monitoring & Alerting Setup ⏱️ 3 hours
- [ ] Sentry (frontend + backend, source maps, test error reporting)
- [ ] Datadog/New Relic (API times, DB times, memory, CPU)
- [ ] UptimeRobot (ping frontend + `/health` every 5min)
- [ ] Alerts: email on critical errors, Slack on API errors > 5%, SMS on downtime > 5min
- [ ] Monitoring dashboard (API times P50/P95/P99, error rates, active users, conversion)
- [ ] Runbook for common issues

**Skills:**
```bash
@sentry-integration         # Sentry setup
@datadog-integration        # Datadog monitoring
@observability-patterns     # Monitoring best practices
```

**Verification:** ✅ Alerts fire on errors + downtime

---

#### Task 3.10: i18n Polish ⏱️ 4 hours
- [ ] Audit hardcoded strings
- [ ] Extract to `en.json` + `es.json`
- [ ] Translate missing strings (Google Translate API / DeepL)
- [ ] Currency, date, phone formatting (locale-specific)
- [ ] Test language switching `/en/*` ↔ `/es/*`
- [ ] Language selector in navbar
- [ ] Persist language preference (cookies)

**Skills:**
```bash
@i18n-best-practices        # i18n patterns
@translation-automation     # Auto-translate with AI
```

**Files:** 15+ changed
**Verification:** ✅ App fully functional in EN + ES

---

#### Task 3.11: Mobile Responsiveness Audit ⏱️ 3 hours
- [ ] Test on: iPhone (375px), iPhone Pro Max (428px), iPad (768px), Android (360px)
- [ ] Fix: navigation (hamburger), forms (full width), tables (scroll), maps (height), modals (full screen)
- [ ] Touch targets min 44px
- [ ] Mobile features: "Call" button (tel:), GPS navigation, Share booking (Web Share API)
- [ ] Lighthouse mobile audit (90+)

**Skills:**
```bash
@responsive-design-patterns # Mobile-first
@accessibility-compliance-accessibility-audit  # Touch targets
@tailwind-patterns          # Responsive utilities
```

**Verification:** ✅ All pages work on mobile

---

#### Task 3.12: Final Production Checklist ⏱️ 6 hours
- [ ] **Environment:** All prod API keys, no placeholders, secrets in vault
- [ ] **Database:** Prod DB created, migrations applied, backups enabled, connection pooling
- [ ] **Domain:** SSL installed, HTTPS enforced, WWW redirect
- [ ] **SEO:** Meta tags, Open Graph, sitemap.xml, robots.txt, Google Analytics, Search Console
- [ ] **Legal:** Privacy Policy, Terms of Service, Cookie consent, Contact page
- [ ] **Testing:** All tests pass, coverage > 80%, manual QA on staging
- [ ] **Performance:** Lighthouse > 90, load time < 2s, no console errors
- [ ] **Security:** OWASP compliant, security headers, rate limiting, 0 vulnerabilities
- [ ] **Monitoring:** Sentry active, uptime monitoring, alerts configured, logs aggregated
- [ ] **Launch:** Soft launch (10-20 beta users) → Monitor 48hrs → Fix bugs → Public launch → Marketing

**Skills:**
```bash
@production-code-audit      # Final audit
@seo-audit                  # SEO checklist
@wcag-audit-patterns        # Accessibility
@security-auditor           # Security audit
```

**Verification:** ✅ Ready for production launch

---

## 🎯 Summary

**Total Tasks:** 31
**Estimated Time:** 115 hours (~3 weeks full-time)
**Current Progress:** 0/31 (0%)

### How to Use This Document
1. Start with Task 1.1
2. Check off each subtask as you complete it
3. Invoke skills listed in **Skills:** section
4. Update progress dashboard weekly
5. Add notes below as you work

---

## 📝 Notes & Learnings

*(Add notes as you complete tasks)*

---

**Last Updated:** February 17, 2026
