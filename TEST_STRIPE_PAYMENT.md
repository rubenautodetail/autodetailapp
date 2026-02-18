# 🧪 HOW TO TEST STRIPE PAYMENTS (SANDBOX)

**Status:** ✅ Ready for Testing
**Test Mode:** Platform-only (Contractor account not required)

---

## 1️⃣ RESTART YOUR BACKEND

Since we updated the API code, you **MUST** restart the backend server.

1. Go to your backend terminal
2. Press `Ctrl+C` to stop the server
3. Run:
   ```bash
   npm run develop
   ```

---

## 2️⃣ TEST THE PAYMENT FLOW

1. **Open the frontend:**
   http://localhost:3000/en/booking/select

2. **Select a Service:**
   - Choose any service (e.g., "Full Detail")
   - Click "Next"

3. **Select Add-ons (Optional):**
   - Add "Pet Hair Removal" or others
   - Click "Next"

4. **Skip Date/Time & Details:**
   - For now, you can manually navigate to the payment page since we haven't connected all the steps yet:
   - Go to: **http://localhost:3000/en/booking/payment**
   *(Note: Make sure you selected a service first so the context has data)*

5. **Enter Test Card Details:**
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/34`)
   - **CVC:** `123`
   - **ZIP:** `12345`

6. **Click Pay:**
   - You should see "Processing..."
   - Then "Payment Successful!"
   - And finally redirect to the confirmation page

---

## 3️⃣ VERIFY IN STRIPE DASHBOARD

1. Go to **Stripe Dashboard** (Test Mode):
   https://dashboard.stripe.com/test/payments

2. You should see a new **succeeded** payment.
   - Description: "Payment for booking..."
   - Amount: Matches your service + add-ons
   - Fee: 15% platform fee (if contractor was set) or full amount (if platform-only)

---

## 🐛 TROUBLESHOOTING

**"Payment intent creation failed"**
- Check your backend logs
- Ensure `STRIPE_SECRET_KEY` is correct in `.env`

**"API Connection Error"**
- Ensure backend is running (`npm run develop`)
- Ensure frontend can reach backend logic

**"Invalid amount"**
- Ensure a service was selected in the context

---

## 🎯 NEXT STEPS (AFTER TESTING)

Once you confirm payments work:
1. **Implement Booking-Payment Connection:** Connect the "Details" step to the "Payment" step.
2. **Contractor Onboarding:** Build the flow for contractors to connect their Stripe accounts.
3. **Webhooks:** Set up webhooks to automatically update booking status in the database.

**Happy Testing! 🚀**
