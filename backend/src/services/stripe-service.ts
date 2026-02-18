/**
 * Stripe Service
 * Handles all Stripe-related operations for the marketplace
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover', // Use a fixed API version or latest
});

// Platform configuration
const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '15');

/**
 * Create a payment intent for a booking
 */
async function createPaymentIntent({
    amount,
    contractorStripeAccountId,
    bookingId,
    customerId,
    currency = 'usd',
    captureMethod = 'automatic',
}: {
    amount: number;
    contractorStripeAccountId?: string | null;
    bookingId: string;
    customerId?: string;
    currency?: string;
    captureMethod?: Stripe.PaymentIntentCreateParams.CaptureMethod;
}) {
    try {
        // Calculate platform fee
        const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));

        // Prepare payment intent parameters
        const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
            amount,
            currency,
            capture_method: captureMethod,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                bookingId,
                customerId: customerId || '',
                platformFee: platformFee.toString(),
            },
        };

        // Only add transfer_data if a valid contractor account is provided
        if (contractorStripeAccountId && contractorStripeAccountId !== 'test_account') {
            paymentIntentParams.application_fee_amount = platformFee;
            paymentIntentParams.transfer_data = {
                destination: contractorStripeAccountId,
            };
            if (paymentIntentParams.metadata) {
                paymentIntentParams.metadata.contractorAmount = (amount - platformFee).toString();
            }

            strapi.log.info(`Creating Connect payment: Amount=$${amount / 100}, Platform Fee=$${platformFee / 100}, Destination=${contractorStripeAccountId}`);
        } else {
            strapi.log.info(`Creating Platform-only payment (Testing): Amount=$${amount / 100}`);
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        strapi.log.info(`Payment intent created: ${paymentIntent.id}`);

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
            platformFee,
            contractorAmount: amount - platformFee,
        };
    } catch (error) {
        strapi.log.error('Failed to create payment intent:', error);
        throw new Error(`Payment intent creation failed: ${(error as Error).message}`);
    }
}

/**
 * Update a payment intent
 */
async function updatePaymentIntent(paymentIntentId: string, data: any) {
    try {
        const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, data);
        strapi.log.info(`Payment intent updated: ${paymentIntent.id}`);
        return paymentIntent;
    } catch (error) {
        strapi.log.error('Failed to update payment intent:', error);
        throw new Error(`Payment intent update failed: ${(error as Error).message}`);
    }
}

/**
 * Capture funds for an authorized payment
 */
async function capturePayment(paymentIntentId: string) {
    try {
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        strapi.log.info(`Payment captured: ${paymentIntent.id}`);
        return paymentIntent;
    } catch (error) {
        strapi.log.error('Failed to capture payment:', error);
        throw new Error(`Payment capture failed: ${(error as Error).message}`);
    }
}

/**
 * Create a Stripe Connect account for a contractor
 */
async function createConnectAccount({
    email,
    businessType = 'individual',
    country = 'US',
    metadata = {},
}: {
    email: string;
    businessType?: Stripe.Account.BusinessType;
    country?: string;
    metadata?: Record<string, string>;
}) {
    try {
        strapi.log.info(`Creating Connect account for: ${email}`);

        const account = await stripe.accounts.create({
            type: 'express',
            country,
            email,
            business_type: businessType,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata,
        });

        strapi.log.info(`Connect account created: ${account.id}`);

        return {
            accountId: account.id,
            email: account.email,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
        };
    } catch (error) {
        strapi.log.error('Failed to create Connect account:', error);
        throw new Error(`Connect account creation failed: ${(error as Error).message}`);
    }
}

/**
 * Create an account link for contractor onboarding
 */
async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return accountLink.url;
    } catch (error) {
        strapi.log.error('Failed to create account link:', error);
        throw new Error(`Account link creation failed: ${(error as Error).message}`);
    }
}

/**
 * Retrieve Connect account details
 */
async function getConnectAccount(accountId: string) {
    try {
        const account = await stripe.accounts.retrieve(accountId);

        return {
            accountId: account.id,
            email: account.email,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            requirements: account.requirements,
        };
    } catch (error) {
        strapi.log.error('Failed to retrieve Connect account:', error);
        throw new Error(`Connect account retrieval failed: ${(error as Error).message}`);
    }
}

/**
 * Create a refund for a payment
 */
async function createRefund(paymentIntentId: string, amount: number | null = null, reason: Stripe.RefundCreateParams.Reason = 'requested_by_customer') {
    try {
        const refundParams: Stripe.RefundCreateParams = {
            payment_intent: paymentIntentId,
            reason,
        };

        if (amount) {
            refundParams.amount = amount;
        }

        const refund = await stripe.refunds.create(refundParams);

        strapi.log.info(`Refund created: ${refund.id} for ${paymentIntentId}`);

        return {
            refundId: refund.id,
            amount: refund.amount,
            status: refund.status,
        };
    } catch (error) {
        strapi.log.error('Failed to create refund:', error);
        throw new Error(`Refund creation failed: ${(error as Error).message}`);
    }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: string | Buffer, signature: string) {
    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );

        return event;
    } catch (error) {
        strapi.log.error('Webhook signature verification failed:', error);
        throw new Error(`Invalid webhook signature: ${(error as Error).message}`);
    }
}

/**
 * Calculate platform fee and contractor amount
 */
function calculateFees(totalAmount: number) {
    const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENTAGE / 100));
    const contractorAmount = totalAmount - platformFee;

    return {
        totalAmount,
        platformFee,
        contractorAmount,
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    };
}

export default {
    stripe,
    createPaymentIntent,
    updatePaymentIntent,
    createConnectAccount,
    createAccountLink,
    getConnectAccount,
    createRefund,
    capturePayment,
    verifyWebhookSignature,
    calculateFees,
};
