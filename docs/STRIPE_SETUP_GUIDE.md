# 🔐 STRIPE CONNECT SETUP GUIDE - SANDBOX/TEST MODE
**Project:** Rubens Auto Detail Platform  
**Date:** February 7, 2026  
**Mode:** Test/Sandbox (No real money)

---

## 📋 OVERVIEW

This guide walks you through setting up **Stripe Connect** in **test mode** for your marketplace platform. You'll be able to:
- ✅ Accept test payments from customers
- ✅ Automatically split commissions (15-25%)
- ✅ Pay out contractors (simulated)
- ✅ Test the entire payment flow without real money

---

## 🚀 STEP 1: CREATE STRIPE ACCOUNT (FREE)

### Do You Need to Register?
**YES** - You need a free Stripe account to get API keys, even for test mode.

### Registration Process:

1. **Go to:** https://dashboard.stripe.com/register
2. **Fill out:**
   - Email address
   - Full name
   - Country (United States)
   - Password
3. **Click:** "Create your Stripe account"
4. **Verify email** (check your inbox)

**Cost:** FREE (no credit card required for test mode)

---

## 🔑 STEP 2: GET YOUR TEST API KEYS

Once you've created your account:

### 1. Access the Dashboard
- Go to: https://dashboard.stripe.com
- **IMPORTANT:** Toggle to **"Test mode"** (switch in top-right corner)
  - You should see "Test mode" badge
  - All data will be fake/test data

### 2. Get Your API Keys
- Click **"Developers"** in left sidebar
- Click **"API keys"**
- You'll see:

```
Publishable key (starts with pk_test_...)
Secret key (starts with sk_test_...)
```

### 3. Copy These Keys
You'll need BOTH keys:
- **Publishable key** → Frontend (Next.js)
- **Secret key** → Backend (Strapi)

**Example keys (yours will be different):**
```bash
# Frontend - Safe to expose in browser
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890

# Backend - KEEP SECRET, never expose
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

## 🔗 STEP 3: ENABLE STRIPE CONNECT

Stripe Connect is required for marketplace payments (platform + contractors).

### 1. Go to Connect Settings
- Dashboard → **Settings** → **Connect**
- Or direct link: https://dashboard.stripe.com/settings/connect

### 2. Enable Connect
- Click **"Get started with Connect"**
- Select **"Platform or marketplace"**
- Fill out:
  - **Platform name:** Rubens Auto Detail
  - **Support email:** your-email@example.com
  - **Platform website:** (can be localhost for now)

### 3. Get Your Connect Client ID
After enabling Connect:
- Go to: https://dashboard.stripe.com/settings/connect/onboarding-options/oauth
- Copy your **Test Client ID**

**Example:**
```bash
STRIPE_CONNECT_CLIENT_ID=ca_FkyHCg7X8mlvCUdMDao4mMxagUfhIwXb
```

---

## 📦 STEP 4: INSTALL STRIPE PACKAGES

Now let's add Stripe to your project:

### Backend (Strapi)
```bash
cd backend
npm install stripe
```

### Frontend (Next.js)
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🔧 STEP 5: CONFIGURE ENVIRONMENT VARIABLES

### Backend: `/backend/.env`

Add these lines to your existing `.env` file:

```bash
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID_HERE

# Platform Commission (15%)
PLATFORM_COMMISSION_RATE=0.15
```

### Frontend: `/frontend/.env.local`

Create or update this file:

```bash
# Stripe Publishable Key (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:1337
```

---

## 🎯 STEP 6: CREATE STRIPE SERVICE (Backend)

Create a centralized Stripe service for your backend:

### File: `/backend/src/services/stripe.ts`

```typescript
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export default stripe;

// Helper: Create connected account for contractor
export async function createConnectedAccount(email: string, country: string = 'US') {
  try {
    const account = await stripe.accounts.create({
      type: 'express', // Express account for contractors
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account;
  } catch (error) {
    console.error('Error creating connected account:', error);
    throw error;
  }
}

// Helper: Create account link for contractor onboarding
export async function createAccountLink(accountId: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/contractor/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/contractor/dashboard`,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

// Helper: Create payment intent with commission split
export async function createPaymentIntent(
  amount: number, // in cents (e.g., 21525 = $215.25)
  contractorAccountId: string,
  metadata: any
) {
  try {
    const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15');
    const applicationFee = Math.round(amount * commissionRate);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card'],
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: contractorAccountId,
      },
      metadata: metadata,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}
```

---

## 💳 STEP 7: TEST PAYMENT FLOW

### Test Credit Cards (No Real Money)

Stripe provides test card numbers that work in test mode:

| Card Number | Type | Result |
|-------------|------|--------|
| `4242 4242 4242 4242` | Visa | ✅ Success |
| `4000 0025 0000 3155` | Visa | ✅ Requires 3D Secure |
| `4000 0000 0000 9995` | Visa | ❌ Declined (insufficient funds) |
| `4000 0000 0000 0002` | Visa | ❌ Declined (generic) |

**For ALL test cards:**
- **Expiry:** Any future date (e.g., 12/28)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## 🧪 STEP 8: TEST CONTRACTOR ACCOUNTS

### Test Contractor Onboarding

When testing contractor registration, use these test values:

#### Personal Information
```
First Name: Test
Last Name: Contractor
Email: contractor@test.com
Phone: 0000000000 (successful validation)
DOB: 1901-01-01 (successful verification)
```

#### Address
```
Address Line 1: address_full_match
City: Miami
State: FL
ZIP: 33186
```

#### ID Number (SSN)
```
SSN: 000-00-0000 (successful match)
Last 4: 0000 (successful verification)
```

#### Bank Account (for payouts)
```
Routing Number: 110000000
Account Number: 000123456789 (payout succeeds)
```

### SMS Verification Code
When prompted for SMS code during contractor onboarding:
```
Code: 000-000
```

---

## 🔔 STEP 9: SET UP WEBHOOKS

Webhooks notify your backend when payments succeed/fail.

### 1. Create Webhook Endpoint in Dashboard
- Go to: https://dashboard.stripe.com/test/webhooks
- Click **"Add endpoint"**
- **Endpoint URL:** `http://localhost:1337/api/webhooks/stripe` (for local testing)
- **Events to send:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `account.updated`
  - `transfer.paid`
  - `payout.paid`

### 2. Get Webhook Secret
After creating the endpoint:
- Click on the webhook
- Click **"Reveal"** under "Signing secret"
- Copy the secret (starts with `whsec_...`)
- Add to `/backend/.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 3. Create Webhook Handler

**File:** `/backend/src/api/webhooks/routes/stripe.ts`

```typescript
import { factories } from '@strapi/strapi';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default factories.createCoreRouter('api::webhook.webhook', {
  config: {
    'POST /stripe': {
      auth: false, // Webhooks don't use auth
      policies: [],
      middlewares: [],
    },
  },
});

// Webhook handler
export async function handleStripeWebhook(ctx) {
  const sig = ctx.request.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      ctx.request.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    ctx.status = 400;
    ctx.body = { error: 'Webhook signature verification failed' };
    return;
  }

  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      
      // Update booking status in database
      await strapi.db.query('api::booking.booking').update({
        where: { id: paymentIntent.metadata.bookingId },
        data: {
          status: 'confirmed',
          paymentIntentId: paymentIntent.id,
          paidAt: new Date(),
        },
      });
      
      // Send confirmation notifications
      // TODO: Implement notification service
      break;

    case 'payment_intent.payment_failed':
      const failed = event.data.object as Stripe.PaymentIntent;
      console.log('❌ Payment failed:', failed.id);
      
      // Update booking status
      await strapi.db.query('api::booking.booking').update({
        where: { id: failed.metadata.bookingId },
        data: { status: 'payment_failed' },
      });
      break;

    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      console.log('🔄 Account updated:', account.id);
      
      // Update contractor Stripe status
      await strapi.db.query('api::contractor.contractor').update({
        where: { stripeAccountId: account.id },
        data: {
          stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
        },
      });
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  ctx.status = 200;
  ctx.body = { received: true };
}
```

---

## 🧪 STEP 10: TEST THE COMPLETE FLOW

### Test Scenario: Customer Books a Service

1. **Customer selects service:** Full Detail ($200) + Pet Hair Removal ($25) = $225
2. **Platform fee (15%):** $33.75
3. **Contractor receives:** $191.25

### Backend Test Code

```typescript
// Create payment intent
const paymentIntent = await createPaymentIntent(
  22500, // $225.00 in cents
  'acct_test_contractor123', // Contractor's Stripe account ID
  {
    bookingId: 'book_123',
    customerId: 'cust_456',
    service: 'full-detail',
  }
);

console.log('Client Secret:', paymentIntent.client_secret);
// Send this to frontend for payment form
```

### Frontend Test Code

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Test Customer',
          email: 'customer@test.com',
        },
      },
    });

    if (error) {
      console.error('Payment failed:', error.message);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('✅ Payment successful!');
      // Redirect to confirmation page
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay $225.00
      </button>
    </form>
  );
}
```

### Test the Payment

1. **Use test card:** `4242 4242 4242 4242`
2. **Expiry:** `12/28`
3. **CVC:** `123`
4. **ZIP:** `12345`
5. **Click "Pay"**
6. **Result:** Payment succeeds, webhook fires, booking confirmed!

---

## 📊 STEP 11: MONITOR TEST PAYMENTS

### View Test Payments in Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. You'll see all test payments
3. Click on any payment to see:
   - Amount
   - Commission split
   - Contractor payout
   - Metadata (booking ID, customer ID, etc.)

### View Test Payouts

1. Go to: https://dashboard.stripe.com/test/connect/accounts
2. Click on a contractor account
3. See their balance and payouts

---

## 🔐 SECURITY BEST PRACTICES

### ✅ DO:
- ✅ Keep `STRIPE_SECRET_KEY` in `.env` (never commit to Git)
- ✅ Use `NEXT_PUBLIC_` prefix only for publishable key
- ✅ Verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Validate amounts on backend (never trust frontend)

### ❌ DON'T:
- ❌ Never expose secret key in frontend
- ❌ Never commit API keys to Git
- ❌ Never skip webhook signature verification
- ❌ Never trust payment amounts from frontend

---

## 🚀 STEP 12: GOING LIVE (FUTURE)

When you're ready to accept real money:

1. **Complete Stripe account verification**
   - Provide business information
   - Add bank account
   - Verify identity

2. **Switch to live mode**
   - Toggle "Live mode" in dashboard
   - Get new API keys (pk_live_... and sk_live_...)
   - Update environment variables

3. **Update webhook endpoint**
   - Change from localhost to production URL
   - Use HTTPS (required)

4. **Test with real card**
   - Use your own card
   - Make a small test payment ($1)
   - Verify everything works

---

## 📋 CHECKLIST

Before implementing Stripe in your app:

- [ ] Created Stripe account
- [ ] Enabled test mode
- [ ] Copied publishable key (pk_test_...)
- [ ] Copied secret key (sk_test_...)
- [ ] Enabled Stripe Connect
- [ ] Copied Connect client ID (ca_...)
- [ ] Installed `stripe` in backend
- [ ] Installed `@stripe/stripe-js` and `@stripe/react-stripe-js` in frontend
- [ ] Added keys to `.env` files
- [ ] Created Stripe service in backend
- [ ] Set up webhook endpoint
- [ ] Copied webhook secret (whsec_...)
- [ ] Tested payment with `4242 4242 4242 4242`
- [ ] Verified webhook fires on payment success

---

## 🆘 TROUBLESHOOTING

### "Invalid API Key"
- ✅ Make sure you're using test keys (pk_test_... and sk_test_...)
- ✅ Check that keys are in correct `.env` files
- ✅ Restart backend after adding keys

### "Webhook signature verification failed"
- ✅ Make sure webhook secret matches dashboard
- ✅ Use `express.raw({type: 'application/json'})` middleware
- ✅ Don't parse request body before verification

### "Payment requires authentication"
- ✅ This is normal for 3D Secure cards
- ✅ Stripe will show authentication popup
- ✅ Use `4242 4242 4242 4242` to skip 3D Secure

### "Connected account not found"
- ✅ Make sure contractor completed Stripe onboarding
- ✅ Check that `stripeAccountId` is saved in database
- ✅ Verify account exists in dashboard

---

## 📚 NEXT STEPS

Now that Stripe is configured, you can:

1. ✅ **Implement booking payment flow** (Week 1-2)
2. ✅ **Build contractor onboarding** (Week 3-4)
3. ✅ **Add webhook handlers** (Week 3-4)
4. ✅ **Test end-to-end payment** (Week 4)
5. ✅ **Add payout automation** (Week 5-6)

---

## 🔗 USEFUL LINKS

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Connect Docs:** https://docs.stripe.com/connect
- **Test Cards:** https://docs.stripe.com/testing
- **Webhook Testing:** https://docs.stripe.com/webhooks/test
- **API Reference:** https://docs.stripe.com/api

---

**Questions?** Check the [Stripe documentation](https://docs.stripe.com) or ask in the project chat!

**Ready to implement?** Start with the booking payment flow in Week 1! 🚀
