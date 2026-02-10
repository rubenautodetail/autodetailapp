# 🎯 NEXT STEPS - ACTION PLAN

**Created:** February 7, 2026  
**Status:** Ready to Execute  
**Estimated Time:** 30 minutes - 2 hours

---

## 🚀 IMMEDIATE ACTIONS (Do This Now!)

### ⏱️ Action 1: Set Up Stripe Webhooks (30 minutes)

**Why:** Webhooks notify your backend when payments succeed/fail

**Steps:**

1. **Open Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Make sure you're in **Test mode** (toggle in top-right)

2. **Add Endpoint**
   - Click **"Add endpoint"** button
   - For local testing, you have 2 options:

   **Option A: Stripe CLI (Recommended)**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local backend
   stripe listen --forward-to localhost:1337/api/webhooks/stripe
   ```
   
   This will output a webhook secret like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

   **Option B: ngrok (Alternative)**
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Start ngrok tunnel
   ngrok http 1337
   
   # Copy the https URL (e.g., https://abc123.ngrok.io)
   # In Stripe Dashboard, use: https://abc123.ngrok.io/api/webhooks/stripe
   ```

3. **Select Events**
   - Check these events:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `account.updated`
     - ✅ `transfer.paid`
     - ✅ `payout.paid`
     - ✅ `payout.failed`

4. **Get Webhook Secret**
   - If using Stripe CLI: Copy from terminal output
   - If using Dashboard: Click webhook → Reveal signing secret

5. **Add to Environment**
   - Open `/backend/.env`
   - Add this line:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
     ```

6. **Restart Backend**
   ```bash
   cd backend
   npm run develop
   ```

**✅ Success Criteria:**
- Webhook endpoint created in Stripe Dashboard
- Webhook secret added to `.env`
- Backend restarted

---

### ⏱️ Action 2: Enable Stripe Connect (15 minutes)

**Why:** Required for marketplace payments with contractors

**Steps:**

1. **Go to Connect Settings**
   - https://dashboard.stripe.com/settings/connect

2. **Enable Connect**
   - Click **"Get started with Connect"**
   - Select **"Platform or marketplace"**

3. **Fill Out Platform Details**
   - Platform name: `Rubens Auto Detail`
   - Support email: Your email
   - Platform website: `http://localhost:3000` (for now)

4. **Get Client ID**
   - Go to: https://dashboard.stripe.com/settings/connect/onboarding-options/oauth
   - Copy your **Test Client ID** (starts with `ca_`)

5. **Add to Environment**
   - Open `/backend/.env`
   - Add this line:
     ```bash
     STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID_HERE
     ```

6. **Restart Backend**
   ```bash
   cd backend
   npm run develop
   ```

**✅ Success Criteria:**
- Stripe Connect enabled
- Client ID added to `.env`
- Backend restarted

---

### ⏱️ Action 3: Test Payment Flow (1 hour)

**Why:** Verify everything works end-to-end

**Steps:**

1. **Start Backend**
   ```bash
   cd backend
   npm run develop
   ```
   **Expected:** Running on http://localhost:1337

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   **Expected:** Running on http://localhost:3000

3. **Create Test Contractor**
   - Go to: http://localhost:1337/admin
   - Login to Strapi admin
   - Go to: Content Manager → Contractors
   - Create new contractor:
     ```
     Name: Test Contractor
     Email: contractor@test.com
     Phone: 5551234567
     stripeAccountId: acct_test_123 (temporary)
     Status: active
     ```

4. **Create Test Booking**
   - Go to: Content Manager → Bookings
   - Create new booking:
     ```
     Service: (select any service)
     Contractor: Test Contractor
     Date: Tomorrow
     Time Window: morning
     Status: pending
     ZIP Code: 33186
     ```
   - Note the booking ID (e.g., `1`)

5. **Test Price Calculation**
   ```bash
   curl -X POST http://localhost:1337/api/bookings/calculate-price \
     -H "Content-Type: application/json" \
     -d '{
       "serviceId": 1,
       "addOnIds": [],
       "zipCode": "33186"
     }'
   ```
   **Expected:** JSON response with price breakdown

6. **Create Payment Intent**
   ```bash
   curl -X POST http://localhost:1337/api/bookings/1/create-payment-intent \
     -H "Content-Type: application/json"
   ```
   **Expected:** JSON with `clientSecret`

7. **Test Payment Form**
   - Create a test page in frontend
   - Use the PaymentForm component
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/28`, CVC: `123`, ZIP: `12345`
   - Click "Pay"

8. **Verify Webhook**
   - Check backend terminal logs
   - Should see: `✅ Payment succeeded for booking 1`
   - Check Stripe Dashboard → Webhooks
   - Should see successful delivery

**✅ Success Criteria:**
- Price calculation works
- Payment intent created
- Payment processes successfully
- Webhook received and processed
- Booking status updated to "confirmed"

---

## 📋 QUICK CHECKLIST

Copy this to track your progress:

```
STRIPE SETUP:
[ ] Stripe account created
[ ] Test mode enabled
[ ] API keys added to .env files
[ ] Stripe packages installed
[ ] Stripe service created
[ ] Payment endpoints created
[ ] Webhook handler created
[ ] Payment form component created

WEBHOOK SETUP:
[ ] Webhook endpoint created (Stripe CLI or Dashboard)
[ ] Webhook events selected
[ ] Webhook secret copied
[ ] Webhook secret added to .env
[ ] Backend restarted

STRIPE CONNECT:
[ ] Connect enabled in dashboard
[ ] Platform details filled out
[ ] Client ID copied
[ ] Client ID added to .env
[ ] Backend restarted

TESTING:
[ ] Backend running
[ ] Frontend running
[ ] Test contractor created
[ ] Test booking created
[ ] Price calculation tested
[ ] Payment intent created
[ ] Payment processed with test card
[ ] Webhook received
[ ] Booking status updated
```

---

## 🆘 TROUBLESHOOTING

### Problem: Webhook signature verification failed

**Solution:**
1. Check that `STRIPE_WEBHOOK_SECRET` is in `.env`
2. Restart backend after adding secret
3. If using Stripe CLI, make sure it's still running
4. Check that webhook secret matches (CLI output or Dashboard)

### Problem: Payment intent creation fails

**Solution:**
1. Verify contractor has `stripeAccountId`
2. Check that booking exists and is in "pending" status
3. Check backend logs for detailed error
4. Verify Stripe API keys are correct

### Problem: Webhook not received

**Solution:**
1. If using Stripe CLI, make sure it's running
2. If using ngrok, make sure tunnel is active
3. Check Stripe Dashboard → Webhooks for delivery attempts
4. Verify endpoint URL is correct
5. Check backend is running and accessible

### Problem: "Cannot find module 'stripe'"

**Solution:**
```bash
cd backend
npm install stripe
```

### Problem: Frontend payment form not rendering

**Solution:**
1. Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
2. Restart frontend dev server
3. Check browser console for errors
4. Verify Stripe.js is loading

---

## 📚 REFERENCE DOCUMENTS

**For detailed instructions, see:**

1. **Webhook Setup:** `/docs/PAYMENT_FLOW_IMPLEMENTATION.md` (Section: 🔔 WEBHOOK SETUP)
2. **Testing Guide:** `/docs/PAYMENT_FLOW_IMPLEMENTATION.md` (Section: 🧪 TESTING)
3. **Stripe Setup:** `/docs/STRIPE_SETUP_GUIDE.md`
4. **Quick Reference:** `/docs/STRIPE_QUICK_REFERENCE.md`

---

## 🎯 AFTER COMPLETING THESE ACTIONS

Once you've completed the above actions, you'll have:

✅ **Fully functional payment system**
- Customers can pay for bookings
- Payments automatically split (15% platform, 85% contractor)
- Webhooks update booking status
- Ready for integration with booking flow

**Next Development Phase:**

Choose one:

1. **Build Booking System** (1-2 weeks)
   - Service selection page
   - Date/time picker
   - Address input
   - Integration with payment

2. **Build Contractor Onboarding** (1-2 weeks)
   - Registration form
   - Stripe Connect onboarding
   - Document upload
   - Verification workflow

3. **Build Assignment Algorithm** (2-3 weeks)
   - Distance calculation
   - Availability checking
   - Auto-assignment logic

**Recommended:** Start with Booking System (it's the core user flow)

---

## ⏰ TIME ESTIMATES

| Action | Time | Difficulty |
|--------|------|------------|
| Set up webhooks | 30 min | Easy |
| Enable Stripe Connect | 15 min | Easy |
| Test payment flow | 1 hour | Medium |
| **TOTAL** | **1h 45min** | **Easy-Medium** |

---

## 🎉 WHEN YOU'RE DONE

You'll have achieved:

1. ✅ Complete payment infrastructure
2. ✅ Automated commission splits
3. ✅ Real-time payment notifications
4. ✅ Production-ready payment system
5. ✅ 25% overall project completion

**Celebrate!** 🎊 You'll have built a sophisticated payment system that handles marketplace transactions automatically!

---

**Ready?** Start with Action 1: Set Up Stripe Webhooks! 🚀

**Questions?** Check the troubleshooting section or reference documents.

**Stuck?** All the code is already written - you just need to configure Stripe Dashboard and test!
