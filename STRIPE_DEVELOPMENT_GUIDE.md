# Stripe Connect Development Guide 🚀

This guide explains how to test the Stripe Connect onboarding flow and handle payouts in a local development environment.

## 1. Local Webhook Bridging
Since Stripe sends account status updates via webhooks, you need to "bridge" Stripe's events to your local machine:

1.  **Install Stripe CLI:** [Download link](https://stripe.com/docs/stripe-cli)
2.  **Login:** `stripe login`
3.  **Forward Webhooks:** 
    ```bash
    npm run stripe:listen
    ```
    *(This uses the command added to the backend `package.json`)*
4.  **Update Secret:** Note the webhook signing secret (starts with `whsec_`) and add it to your backend `.env` as `STRIPE_WEBHOOK_SECRET`.

## 2. Onboarding Flow Test
1.  **Start Platform:** Ensure both backend and frontend are running.
2.  **Login as Contractor:** Go to the contractor settings page.
3.  **Click "Connect Stripe":** This will redirect you to a Stripe-hosted Express onboarding flow.
4.  **Use Test Data:** Stripe will provide a "test mode" banner. You can use fake info or the "skip this step" option to simulate successful verification.
5.  **Redirect Back:** Once complete, Stripe redirects you back to the platform.
6.  **Verify Sync:** The `account.updated` webhook should fire, and your contractor profile in Strapi should now show `stripeOnboardingComplete: true`.

## 3. Payout Verification
1.  **Complete a Job:** As a contractor, go through the "Complete Job" workflow.
2.  **Payment Capture:** The platform will trigger `stripe.paymentIntents.capture` and route the funds (minus platform fee) to your Connect account.
3.  **Check Stripe Dashboard:** Log into your [Stripe Dashboard](https://dashboard.stripe.com/test/connect/accounts) to see the balance update on your test contractor account.

## 4. Maintenance & Data Integrity
If you have existing contractors that were created before the User-Contractor link was added:

```bash
# Run the mapping script to link them automatically
npm run db:map-users
```

## 5. Required Production Keys
When moving to production, update `.env.production`:
- `STRIPE_SECRET_KEY`: Live secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Live publishable key
- `FRONTEND_URL`: Your production domain (e.g., `https://rubensautodetail.com`)
