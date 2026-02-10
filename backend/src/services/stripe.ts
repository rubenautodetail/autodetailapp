import Stripe from 'stripe';

// Initialize Stripe with secret key (will be validated on first use)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

export default stripe;

/**
 * Create a connected account for a contractor
 * @param email - Contractor's email
 * @param country - Country code (default: US)
 * @returns Stripe Account object
 */
export async function createConnectedAccount(
    email: string,
    country: string = 'US'
): Promise<Stripe.Account> {
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

        console.log('✅ Created connected account:', account.id);
        return account;
    } catch (error) {
        console.error('❌ Error creating connected account:', error);
        throw error;
    }
}

/**
 * Create an account link for contractor onboarding
 * @param accountId - Stripe account ID
 * @returns Account link URL
 */
export async function createAccountLink(
    accountId: string
): Promise<Stripe.AccountLink> {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${frontendUrl}/contractor/onboarding/refresh`,
            return_url: `${frontendUrl}/contractor/dashboard`,
            type: 'account_onboarding',
        });

        console.log('✅ Created account link for:', accountId);
        return accountLink;
    } catch (error) {
        console.error('❌ Error creating account link:', error);
        throw error;
    }
}

/**
 * Create a payment intent with automatic commission split
 * @param amount - Amount in cents (e.g., 21525 = $215.25)
 * @param contractorAccountId - Contractor's Stripe account ID
 * @param metadata - Additional metadata for the payment
 * @returns Payment intent with client secret
 */
export async function createPaymentIntent(
    amount: number,
    contractorAccountId: string,
    metadata: {
        bookingId: string;
        customerId: string;
        contractorId: string;
        service: string;
        [key: string]: any;
    }
): Promise<Stripe.PaymentIntent> {
    try {
        const commissionRate = parseFloat(
            process.env.PLATFORM_COMMISSION_RATE || '0.15'
        );
        const applicationFee = Math.round(amount * commissionRate);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
            application_fee_amount: applicationFee,
            transfer_data: {
                destination: contractorAccountId,
            },
            metadata: {
                ...metadata,
                platformFee: applicationFee.toString(),
                contractorAmount: (amount - applicationFee).toString(),
            },
        });

        console.log('✅ Created payment intent:', paymentIntent.id);
        console.log(`   Amount: $${(amount / 100).toFixed(2)}`);
        console.log(`   Platform fee (${commissionRate * 100}%): $${(applicationFee / 100).toFixed(2)}`);
        console.log(`   Contractor gets: $${((amount - applicationFee) / 100).toFixed(2)}`);

        return paymentIntent;
    } catch (error) {
        console.error('❌ Error creating payment intent:', error);
        throw error;
    }
}

/**
 * Retrieve account details
 * @param accountId - Stripe account ID
 * @returns Account object
 */
export async function getAccount(accountId: string): Promise<Stripe.Account> {
    try {
        const account = await stripe.accounts.retrieve(accountId);
        return account;
    } catch (error) {
        console.error('❌ Error retrieving account:', error);
        throw error;
    }
}

/**
 * Check if account onboarding is complete
 * @param accountId - Stripe account ID
 * @returns Boolean indicating if onboarding is complete
 */
export async function isOnboardingComplete(accountId: string): Promise<boolean> {
    try {
        const account = await stripe.accounts.retrieve(accountId);
        return account.charges_enabled && account.payouts_enabled;
    } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
        return false;
    }
}

/**
 * Construct webhook event from request
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
        return event;
    } catch (error) {
        console.error('❌ Webhook signature verification failed:', error);
        throw error;
    }
}
