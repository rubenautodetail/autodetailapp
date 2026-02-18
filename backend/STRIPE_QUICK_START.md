# 🚀 STRIPE SETUP - QUICK START GUIDE
**Status:** ✅ API Keys Found | ⏳ Need Webhook Secret & Connect Client ID

---

## ✅ WHAT YOU ALREADY HAVE

### Frontend (`.env.local`):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SyF58R1rY1O9SXyE832nkEQWbMVP5c9JNmgdWrmOciIn5ZC6GDrXvandI7tgH2cRq3mhfyg4zsJj9o8PGztwBtf00iLjO2qE1
```
✅ **Status:** READY TO USE

### Backend (`.env`):
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```
⚠️ **Replace with your actual Stripe secret key from dashboard.stripe.com/test/apikeys**

---

## ⏳ WHAT YOU STILL NEED

### 1. **Webhook Secret** (5 minutes)

**Steps:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   http://localhost:1337/api/payments/webhook
   ```
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `account.updated`
   - ✅ `payout.paid`
5. Click **"Add endpoint"**
6. Click **"Reveal"** next to "Signing secret"
7. Copy the secret (starts with `whsec_...`)
8. Update `backend/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

### 2. **Connect Client ID** (5 minutes)

**Steps:**
1. Go to: https://dashboard.stripe.com/test/connect/accounts/overview
2. If you see "Get started with Connect":
   - Click **"Get started"**
   - Choose **"Platform or marketplace"**
   - Complete the setup wizard
3. Once enabled, go to: https://dashboard.stripe.com/test/settings/applications
4. Under "Development", find your **Client ID** (starts with `ca_...`)
5. Copy the Client ID
6. Update `backend/.env`:
   ```bash
   STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID_HERE
   ```

---

## 🧪 TEST YOUR SETUP

### Step 1: Restart Backend
```bash
# Stop the current backend (Ctrl+C)
cd backend
npm run develop
```

### Step 2: Test Payment Intent Creation
```bash
curl -X POST http://localhost:1337/api/payments/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'
```

**Expected Response:**
```json
{
  "success": true,
  "totalAmount": 10000,
  "platformFee": 1500,
  "contractorAmount": 8500,
  "platformFeePercentage": 15
}
```

---

### Step 3: Test Webhook (After Setup)
```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:1337/api/payments/webhook
```

This will give you a webhook secret for local testing!

---

## 📊 CURRENT STATUS

| Component | Status |
|-----------|--------|
| **Publishable Key** | ✅ Configured |
| **Secret Key** | ✅ Configured |
| **Webhook Secret** | ⏳ Need to set up |
| **Connect Client ID** | ⏳ Need to set up |
| **Backend Code** | ✅ Ready |
| **Frontend Code** | ✅ Ready |

---

## 🎯 NEXT STEPS

### Option A: Get Credentials Now (10 min)
1. Get webhook secret (5 min)
2. Get Connect client ID (5 min)
3. Restart backend
4. Test payment flow

### Option B: Use Stripe CLI for Testing (5 min)
```bash
# This gives you a temporary webhook secret for testing
stripe listen --forward-to localhost:1337/api/payments/webhook

# Copy the webhook secret it provides
# Add to backend/.env temporarily
```

### Option C: Test Without Webhooks First
You can test payment intent creation without webhooks:
```bash
curl -X POST http://localhost:1337/api/payments/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'
```

---

## 🔗 USEFUL LINKS

- **Stripe Dashboard:** https://dashboard.stripe.com/test/dashboard
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Connect Settings:** https://dashboard.stripe.com/test/settings/applications
- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli

---

## 💡 QUICK TIP

**For local development, use Stripe CLI:**
```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks (gives you a webhook secret automatically!)
stripe listen --forward-to localhost:1337/api/payments/webhook
```

This is the **fastest way** to test webhooks locally!

---

**What would you like to do?**
- **A)** Get webhook secret & Connect client ID from dashboard
- **B)** Use Stripe CLI for quick testing
- **C)** Test payment calculations without webhooks first

Let me know! 🚀
