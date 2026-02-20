# ✅ IMMEDIATE ACTION CHECKLIST
**Start Date:** February 11, 2026  
**Goal:** Get project production-ready in 15 weeks

---

## 🚨 THIS WEEK (Week 1): Foundation Fixes

### Day 1-2: Critical Code Quality Fixes

#### ✅ Task 1: Fix i18n Implementation
**Priority:** 🔴 CRITICAL  
**Skill:** `@i18n-localization`  
**Issue:** Line 95 in `booking/select/page.tsx` has hardcoded translations

**Action:**
```bash
Use @i18n-localization to audit frontend/src/app/[lang]/booking/select/page.tsx and fix the TODO on line 95
```

**Expected Outcome:**
- Strapi i18n plugin enabled
- API calls fetch localized content
- No more hardcoded `nameEs: s.name` fallbacks

**Files to Update:**
- `frontend/src/lib/api/strapi.ts`
- `frontend/src/app/[lang]/booking/select/page.tsx`
- `backend/config/plugins.ts`

---

#### ✅ Task 2: Extract and Optimize Components
**Priority:** 🔴 HIGH  
**Skill:** `@react-patterns`

**Issues Found:**
- ServiceCard component defined inline (lines 22-87)
- Missing custom hooks for reusable logic
- No error boundaries

**Action:**
```bash
Use @react-patterns to review and refactor frontend/src/app/[lang]/booking/select/page.tsx
```

**Expected Outcome:**
- ServiceCard extracted to `frontend/src/components/booking/ServiceCard.tsx`
- Custom hooks created for booking logic
- Error boundaries added

**Files to Create:**
- `frontend/src/components/booking/ServiceCard.tsx`
- `frontend/src/hooks/useBookingData.ts`
- `frontend/src/components/booking/BookingErrorBoundary.tsx`

---

#### ✅ Task 3: Optimize App Router Usage
**Priority:** 🟡 MEDIUM  
**Skill:** `@nextjs-app-router-patterns`

**Action:**
```bash
Use @nextjs-app-router-patterns to audit frontend/src/app/[lang]/booking/ and optimize Server/Client component split
```

**Expected Outcome:**
- Proper Server Component usage for data fetching
- Client Components only where needed
- Loading and error states added

**Files to Create:**
- `frontend/src/app/[lang]/booking/loading.tsx`
- `frontend/src/app/[lang]/booking/error.tsx`
- `frontend/src/app/[lang]/booking/layout.tsx`

---

### Day 3-4: Authentication Setup

#### ✅ Task 4: Implement Supabase Auth
**Priority:** 🔴 CRITICAL  
**Skill:** `@nextjs-supabase-auth`

**Why Critical:** Blocks all user-specific features

**Action:**
```bash
Use @nextjs-supabase-auth to implement authentication for customers and contractors
```

**Expected Outcome:**
- Auth middleware working
- Login/signup pages created
- Protected routes configured
- Contractor separate auth flow

**Files to Create:**
- `frontend/src/lib/supabase/client.ts`
- `frontend/src/lib/supabase/server.ts`
- `frontend/src/middleware.ts`
- `frontend/src/app/[lang]/auth/login/page.tsx`
- `frontend/src/app/[lang]/auth/signup/page.tsx`
- `frontend/src/app/[lang]/auth/callback/route.ts`
- `frontend/src/app/[lang]/auth/contractor/login/page.tsx`
- `frontend/src/app/[lang]/auth/contractor/register/page.tsx`

**Environment Check:**
```bash
# Verify these are set in frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://ihrxhuyjhdesgadpowus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8gWSWksG23E3in30-Buoyg_SULYJdUm
```

---

### Day 5-7: Payment Integration Setup

#### ✅ Task 5: Set Up Stripe Connect
**Priority:** 🔴 CRITICAL  
**Skill:** `@stripe-integration`

**Why Critical:** No payments = no revenue

**Pre-requisites:**
1. Create Stripe account at https://stripe.com
2. Get test API keys
3. Enable Stripe Connect

**Action:**
```bash
Use @stripe-integration to implement Stripe Connect for marketplace payments with contractor payouts
```

**Expected Outcome:**
- Stripe packages installed
- Payment intent API created
- Checkout form component built
- Webhook handler implemented
- Commission calculation working

**Packages to Install:**
```bash
# Backend
cd backend
npm install stripe

# Frontend  
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Files to Create:**
```
backend/src/api/payments/
├── routes/create-payment-intent.ts
├── routes/webhook.ts
├── routes/connect-account.ts
├── controllers/payment-controller.ts
└── services/
    ├── stripe-service.ts
    └── commission-calculator.ts

frontend/src/components/payment/
├── CheckoutForm.tsx
├── PaymentStatus.tsx
└── StripeProvider.tsx

frontend/src/app/[lang]/booking/payment/page.tsx
```

**Environment Variables to Set:**
```bash
# backend/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENTAGE=15

# frontend/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📊 WEEK 1 SUCCESS CRITERIA

By end of Week 1, you should have:

- [ ] ✅ i18n fully working (no hardcoded translations)
- [ ] ✅ Components properly extracted and optimized
- [ ] ✅ App Router patterns optimized
- [ ] ✅ Authentication working for customers and contractors
- [ ] ✅ Stripe integration ready (test mode)
- [ ] ✅ All environment variables configured
- [ ] ✅ Code quality improved significantly

---

## 🚀 WEEK 2 PREVIEW: Booking System

**Goal:** Build the complete booking flow (4 pages)

**Key Tasks:**
1. Create location selection page
2. Build calendar and time slot selection
3. Implement payment page
4. Add confirmation page
5. Create availability checking algorithm

**Skills to Use:**
- `@nextjs-app-router-patterns`
- `@react-patterns`
- `@stripe-integration`

---

## 📝 DAILY STANDUP TEMPLATE

Use this template to track progress:

### Date: [DATE]

**Yesterday:**
- [ ] Task completed
- [ ] Blockers encountered

**Today:**
- [ ] Task 1
- [ ] Task 2

**Blockers:**
- None / [Describe blocker]

**Skill Used:**
- `@skill-name`

---

## 🎯 QUICK COMMANDS REFERENCE

### For i18n Fix:
```bash
Use @i18n-localization to audit frontend/src/app/[lang]/booking/select/page.tsx
```

### For Component Refactoring:
```bash
Use @react-patterns to refactor frontend/src/app/[lang]/booking/select/page.tsx
```

### For App Router Optimization:
```bash
Use @nextjs-app-router-patterns to optimize frontend/src/app/[lang]/booking/
```

### For Authentication:
```bash
Use @nextjs-supabase-auth to implement authentication
```

### For Stripe:
```bash
Use @stripe-integration to set up Stripe Connect
```

---

## 🔍 TESTING YOUR PROGRESS

### After Task 1 (i18n):
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/es/booking/select
# Verify Spanish translations load from Strapi
```

### After Task 2 (Components):
```bash
# Check that ServiceCard is now in its own file
ls frontend/src/components/booking/ServiceCard.tsx
```

### After Task 3 (App Router):
```bash
# Check that loading states exist
ls frontend/src/app/[lang]/booking/loading.tsx
ls frontend/src/app/[lang]/booking/error.tsx
```

### After Task 4 (Auth):
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/en/auth/login
# Try signing up
```

### After Task 5 (Stripe):
```bash
cd backend
npm run develop
# Test payment intent creation
curl -X POST http://localhost:1337/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "currency": "usd"}'
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: Strapi i18n not working
**Solution:**
1. Enable i18n plugin in `backend/config/plugins.ts`
2. Add locales in Strapi admin panel
3. Restart Strapi: `npm run develop`

### Issue: Supabase auth not working
**Solution:**
1. Check environment variables are set
2. Verify Supabase project is active
3. Check middleware.ts is configured correctly

### Issue: Stripe webhook failing
**Solution:**
1. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:1337/api/payments/webhook`
2. Verify webhook secret is correct
3. Check webhook signature verification

---

## 📞 NEED HELP?

If you get stuck on any task:

1. **Read the skill documentation:**
   ```bash
   cat ~/.agent/skills/[skill-name]/SKILL.md
   ```

2. **Ask for specific help:**
   ```bash
   Use @[skill-name] to help me with [specific issue]
   ```

3. **Check the resources:**
   ```bash
   ls ~/.agent/skills/[skill-name]/resources/
   ```

---

## ✅ COMPLETION CHECKLIST

Mark tasks as complete:

### Day 1-2:
- [ ] Task 1: i18n fixed
- [ ] Task 2: Components refactored
- [ ] Task 3: App Router optimized

### Day 3-4:
- [ ] Task 4: Authentication implemented

### Day 5-7:
- [ ] Task 5: Stripe integration complete

### Week 1 Complete:
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Ready for Week 2

---

**Remember:** Use the skills! They're designed to guide you through each task with best practices and proven patterns.

**Next:** After completing Week 1, refer to `IMPLEMENTATION_ROADMAP.md` for Week 2 tasks.
