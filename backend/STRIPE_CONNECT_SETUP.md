# 💳 STRIPE CONNECT SETUP GUIDE - RUBENS AUTO DETAIL PLATFORM
**Date:** February 11, 2026  
**Type:** Marketplace Payment Integration  
**Model:** Stripe Connect (Platform + Contractors)

---

## 🎯 OVERVIEW

### What is Stripe Connect?
Stripe Connect allows you to:
- Accept payments on behalf of contractors
- Automatically split payments (platform fee + contractor payout)
- Handle contractor onboarding and verification
- Manage payouts to contractors
- Track earnings and commissions

### Your Business Model:
```
Customer pays $100 for service
  ↓
Platform takes 15% ($15)
  ↓
Contractor receives 85% ($85)
```

---

## 📋 PREREQUISITES

### 1. Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Sign up with business email
3. Complete business verification
4. Get your API keys

### 2. Enable Stripe Connect
1. Go to https://dashboard.stripe.com/connect/accounts/overview
2. Click "Get started with Connect"
3. Choose "Platform or marketplace"
4. Complete Connect setup

---

## 🔑 API KEYS NEEDED

### Backend (.env):
```bash
# Stripe Secret Keys
STRIPE_SECRET_KEY=sk_test_...                    # Test mode
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=15                       # 15% commission
STRIPE_CONNECT_CLIENT_ID=ca_...                  # Connect client ID
```

### Frontend (.env.local):
```bash
# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Test mode
```

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Install Stripe Packages

#### Backend:
```bash
cd backend
npm install stripe
```

#### Frontend:
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

### Step 2: Set Up Stripe Service (Backend)

**File:** `backend/src/services/stripe-service.js`

This service handles:
- Payment intent creation
- Contractor Connect account creation
- Commission calculation
- Webhook verification

---

### Step 3: Create Payment API Routes (Backend)

**Files to create:**
1. `backend/src/api/payments/routes/create-payment-intent.js`
2. `backend/src/api/payments/routes/webhook.js`
3. `backend/src/api/payments/controllers/payment-controller.js`

---

### Step 4: Contractor Connect Onboarding

**Files to create:**
1. `backend/src/api/contractors/routes/connect-account.js`
2. `backend/src/api/contractors/controllers/connect-controller.js`

---

### Step 5: Frontend Payment Components

**Files to create:**
1. `frontend/src/components/payment/StripeProvider.tsx`
2. `frontend/src/components/payment/CheckoutForm.tsx`
3. `frontend/src/components/payment/PaymentStatus.tsx`
4. `frontend/src/app/[lang]/booking/payment/page.tsx`

---

## 💰 PAYMENT FLOW

### Customer Booking Flow:
```
1. Customer selects service ($100)
   ↓
2. Frontend creates payment intent
   POST /api/payments/create-intent
   {
     amount: 10000,  // $100 in cents
     bookingId: "abc123",
     contractorId: "contractor_xyz"
   }
   ↓
3. Backend calculates split:
   - Platform fee: $15 (15%)
   - Contractor: $85 (85%)
   ↓
4. Create PaymentIntent with application_fee
   ↓
5. Customer completes payment
   ↓
6. Webhook confirms payment
   ↓
7. Update booking status
   ↓
8. Contractor receives $85 in their account
```

---

## 🔧 CONTRACTOR ONBOARDING FLOW

### Contractor Registration:
```
1. Contractor fills registration form
   ↓
2. Create Stripe Connect account
   POST /api/contractors/create-connect-account
   {
     email: "contractor@example.com",
     businessType: "individual",
     country: "US"
   }
   ↓
3. Generate Connect onboarding link
   ↓
4. Redirect contractor to Stripe onboarding
   ↓
5. Contractor completes verification
   ↓
6. Webhook confirms account verified
   ↓
7. Contractor can receive payouts
```

---

## 🎨 WEBHOOK EVENTS TO HANDLE

### Critical Events:

1. **`payment_intent.succeeded`**
   - Payment completed
   - Update booking status to "paid"
   - Send confirmation emails

2. **`payment_intent.payment_failed`**
   - Payment failed
   - Notify customer
   - Release time slot reservation

3. **`account.updated`**
   - Contractor account status changed
   - Update contractor verification status

4. **`payout.paid`**
   - Contractor payout completed
   - Update contractor earnings record

5. **`charge.refunded`**
   - Refund processed
   - Update booking status
   - Handle contractor payout reversal

---

## 🧪 TESTING

### Test Cards:
```javascript
// Success
4242 4242 4242 4242

// Declined
4000 0000 0000 0002

// 3D Secure Required
4000 0025 0000 3155

// Insufficient Funds
4000 0000 0000 9995
```

### Test Flow:
1. Create test contractor Connect account
2. Create test booking
3. Process test payment
4. Verify webhook events
5. Check contractor balance

---

## 📊 COMMISSION CALCULATION

### Example:
```javascript
// Service: $100
// Add-ons: $50
// Total: $150

const totalAmount = 15000; // $150 in cents
const platformFeePercentage = 15; // 15%

const platformFee = Math.round(totalAmount * (platformFeePercentage / 100));
// platformFee = 2250 ($22.50)

const contractorAmount = totalAmount - platformFee;
// contractorAmount = 12750 ($127.50)
```

---

## 🔒 SECURITY CHECKLIST

- [ ] Verify webhook signatures
- [ ] Use environment variables for keys
- [ ] Never expose secret keys to frontend
- [ ] Validate all amounts server-side
- [ ] Implement idempotency for webhooks
- [ ] Log all payment events
- [ ] Handle errors gracefully
- [ ] Use HTTPS in production

---

## 📈 MONITORING

### Key Metrics to Track:
- Payment success rate
- Average transaction amount
- Platform fee revenue
- Contractor payout volume
- Failed payment reasons
- Refund rate

### Stripe Dashboard:
- https://dashboard.stripe.com/payments
- https://dashboard.stripe.com/connect/accounts
- https://dashboard.stripe.com/webhooks

---

## 🚨 COMMON ISSUES

### Issue 1: Webhook Not Receiving Events
**Solution:**
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check Stripe dashboard for failed deliveries

### Issue 2: Payment Fails with "Invalid API Key"
**Solution:**
- Ensure using correct test/live keys
- Check environment variables are loaded
- Verify API key has correct permissions

### Issue 3: Contractor Can't Receive Payouts
**Solution:**
- Verify Connect account is fully verified
- Check payout schedule settings
- Ensure bank account is connected

---

## 📚 NEXT STEPS

1. ✅ Read this guide
2. ✅ Get Stripe API keys
3. ✅ Install packages
4. ✅ Implement backend services
5. ✅ Create payment routes
6. ✅ Build frontend components
7. ✅ Set up webhooks
8. ✅ Test payment flow
9. ✅ Test contractor onboarding
10. ✅ Deploy to production

---

## 📖 ADDITIONAL RESOURCES

- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Payment Intents:** https://stripe.com/docs/payments/payment-intents
- **Webhooks:** https://stripe.com/docs/webhooks
- **Testing:** https://stripe.com/docs/testing

---

**Status:** 📋 Ready to implement  
**Estimated Time:** 2-3 days  
**Priority:** 🔴 CRITICAL (blocks revenue)

---

**Next:** Start with Step 1 - Install packages and get API keys
