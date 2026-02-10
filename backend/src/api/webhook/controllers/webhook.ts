/**
 * Stripe webhook controller
 * Handles webhook events from Stripe
 */

import { constructWebhookEvent } from '../../../services/stripe';
import Stripe from 'stripe';

export default {
    /**
     * Handle Stripe webhook events
     * POST /api/webhooks/stripe
     */
    async stripe(ctx) {
        const sig = ctx.request.headers['stripe-signature'];

        if (!sig) {
            ctx.status = 400;
            ctx.body = { error: 'Missing stripe-signature header' };
            return;
        }

        let event: Stripe.Event;

        try {
            // Construct and verify webhook event
            event = constructWebhookEvent(ctx.request.body, sig);
        } catch (err: any) {
            strapi.log.error('⚠️ Webhook signature verification failed:', err.message);
            ctx.status = 400;
            ctx.body = { error: `Webhook Error: ${err.message}` };
            return;
        }

        // Handle the event
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                    break;

                case 'account.updated':
                    await handleAccountUpdated(event.data.object as Stripe.Account);
                    break;

                case 'payout.paid':
                    await handlePayoutPaid(event.data.object as Stripe.Payout);
                    break;

                case 'payout.failed':
                    await handlePayoutFailed(event.data.object as Stripe.Payout);
                    break;

                default:
                    strapi.log.info(`Unhandled event type: ${event.type}`);
            }

            ctx.status = 200;
            ctx.body = { received: true };
        } catch (error: any) {
            strapi.log.error('Error processing webhook:', error);
            ctx.status = 500;
            ctx.body = { error: 'Webhook processing failed' };
        }
    },
};

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
        strapi.log.warn('Payment succeeded but no booking ID in metadata:', paymentIntent.id);
        return;
    }

    strapi.log.info(`✅ Payment succeeded for booking ${bookingId}: ${paymentIntent.id}`);

    try {
        // Update booking status
        const booking = await strapi.entityService.update('api::booking.booking', bookingId, {
            data: {
                status: 'confirmed',
                paymentIntentId: paymentIntent.id,
                paidAt: new Date(),
            },
            populate: {
                service: true,
                contractor: true,
                customer: true,
            },
        });

        strapi.log.info(`✅ Booking ${bookingId} confirmed`);

        // TODO: Send notifications
        // 1. Email confirmation to customer
        // 2. SMS confirmation to customer
        // 3. Notification to contractor (new booking)
        // 4. Notification to admin (new booking)

        // TODO: Trigger contractor assignment if not already assigned
        // if (!booking.contractor) {
        //   await strapi.service('api::booking.booking').assignContractor(bookingId);
        // }

    } catch (error: any) {
        strapi.log.error(`Error updating booking ${bookingId}:`, error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
        strapi.log.warn('Payment failed but no booking ID in metadata:', paymentIntent.id);
        return;
    }

    strapi.log.error(`❌ Payment failed for booking ${bookingId}: ${paymentIntent.id}`);

    try {
        // Update booking status
        await strapi.entityService.update('api::booking.booking', bookingId, {
            data: {
                status: 'payment_failed',
                paymentIntentId: paymentIntent.id,
            },
        });

        strapi.log.info(`❌ Booking ${bookingId} marked as payment failed`);

        // TODO: Send notification to customer about payment failure
        // TODO: Optionally retry payment or cancel booking after X attempts

    } catch (error: any) {
        strapi.log.error(`Error updating booking ${bookingId}:`, error);
    }
}

/**
 * Handle contractor account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
    strapi.log.info(`🔄 Account updated: ${account.id}`);

    try {
        // Find contractor with this Stripe account
        const contractors = await strapi.entityService.findMany('api::contractor.contractor', {
            filters: {
                stripeAccountId: account.id,
            },
        });

        if (contractors && contractors.length > 0) {
            const contractor = contractors[0];

            // Update contractor's Stripe status
            await strapi.entityService.update('api::contractor.contractor', contractor.id, {
                data: {
                    stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
                    stripeChargesEnabled: account.charges_enabled,
                    stripePayoutsEnabled: account.payouts_enabled,
                },
            });

            strapi.log.info(`✅ Contractor ${contractor.id} Stripe status updated`);

            // TODO: Send notification if onboarding is complete
            if (account.charges_enabled && account.payouts_enabled) {
                // Send "You're ready to receive bookings!" notification
            }
        }
    } catch (error: any) {
        strapi.log.error(`Error updating contractor account ${account.id}:`, error);
    }
}

/**
 * Handle payout paid
 */
async function handlePayoutPaid(payout: Stripe.Payout) {
    strapi.log.info(`💸 Payout paid: ${payout.id} - $${(payout.amount / 100).toFixed(2)}`);

    // TODO: Log payout for accounting/reporting
}

/**
 * Handle payout failed
 */
async function handlePayoutFailed(payout: Stripe.Payout) {
    strapi.log.error(`❌ Payout failed: ${payout.id} - $${(payout.amount / 100).toFixed(2)}`);

    // TODO: Alert admin about failed payout
    // TODO: Notify contractor about payout issue
}
