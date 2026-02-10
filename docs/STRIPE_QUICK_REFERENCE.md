# 🎯 STRIPE QUICK REFERENCE - TEST MODE

## 📝 YOUR ACTION ITEMS

### 1. Register for Stripe (5 minutes)
- [ ] Go to: https://dashboard.stripe.com/register
- [ ] Create account (FREE, no credit card needed)
- [ ] Verify your email

### 2. Get API Keys (2 minutes)
- [ ] Login to: https://dashboard.stripe.com
- [ ] Toggle to **"Test mode"** (top-right)
- [ ] Go to: Developers → API keys
- [ ] Copy both keys:
  ```
  Publishable key: pk_test_...
  Secret key: sk_test_...
  ```

### 3. Enable Stripe Connect (3 minutes)
- [ ] Go to: Settings → Connect
- [ ] Click "Get started with Connect"
- [ ] Select "Platform or marketplace"
- [ ] Fill out platform details
- [ ] Copy Client ID: ca_...

### 4. Add Keys to Project (1 minute)
- [ ] Add to `/backend/.env`:
  ```bash
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY
  STRIPE_CONNECT_CLIENT_ID=ca_YOUR_ID
  ```
- [ ] Add to `/frontend/.env.local`:
  ```bash
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
  ```

### 5. Install Packages (2 minutes)
```bash
# Backend
cd backend
npm install stripe

# Frontend
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🧪 TEST CARDS (No Real Money!)

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |

**For all cards:**
- Expiry: Any future date (12/28)
- CVC: Any 3 digits (123)
- ZIP: Any 5 digits (12345)

---

## 🧑‍💼 TEST CONTRACTOR DATA

```
Email: contractor@test.com
Phone: 0000000000
DOB: 1901-01-01
SSN: 000-00-0000

Address:
  Line 1: address_full_match
  City: Miami
  State: FL
  ZIP: 33186

Bank Account:
  Routing: 110000000
  Account: 000123456789

SMS Code: 000-000
```

---

## 💰 COMMISSION EXAMPLE

```
Service Total: $225.00
Platform Fee (15%): -$33.75
Contractor Gets: $191.25
```

---

## 📊 MONITOR PAYMENTS

- **Payments:** https://dashboard.stripe.com/test/payments
- **Contractors:** https://dashboard.stripe.com/test/connect/accounts
- **Webhooks:** https://dashboard.stripe.com/test/webhooks

---

## ✅ TOTAL TIME: ~15 MINUTES

**Full guide:** `/docs/STRIPE_SETUP_GUIDE.md`
