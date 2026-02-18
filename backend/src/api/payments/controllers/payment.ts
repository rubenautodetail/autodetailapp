/**
 * Payment Controller
 * Handles payment-related API requests using Supabase for bookings
 */

import stripeService from '../../../services/stripe-service';
import { getSupabaseBooking, updateSupabaseBooking } from '../../../services/supabase-service';

export default {
    /**
     * Create a payment intent for a booking
     * POST /api/payments/create-intent
     */
    async createIntent(ctx) {
        try {
            const { bookingId, amount, contractorId } = ctx.request.body as any;

            // Validate amount
            if (!amount || amount <= 0) {
                return ctx.badRequest('Invalid amount');
            }

            let contractorStripeAccountId = null;
            let customerId = 'guest';

            // 1. Try to get booking from Supabase
            if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
                try {
                    const booking = await getSupabaseBooking(bookingId);
                    if (booking) {
                        customerId = booking.customer_email || 'guest';
                        strapi.log.info(`Booking ${bookingId} found in Supabase for customer ${customerId}`);
                    } else {
                        strapi.log.warn(`Booking ${bookingId} not found in Supabase`);
                    }
                } catch (err) {
                    strapi.log.warn(`Supabase booking lookup failed for ${bookingId}, continuing in test mode`);
                }
            }

            // 2. Try to get contractor from Strapi (Contractors haven't fully migrated yet)
            if (contractorId) {
                try {
                    const contractor = await (strapi as any).documents('api::contractor.contractor').findOne({
                        documentId: contractorId,
                    });

                    if (contractor && contractor.stripeAccountId) {
                        contractorStripeAccountId = contractor.stripeAccountId;
                    } else if (contractor) {
                        strapi.log.warn(`Contractor ${contractorId} has no Stripe account, processing as platform-only`);
                    }
                } catch (err) {
                    strapi.log.warn(`Contractor ${contractorId} check failed, continuing as platform-only`);
                }
            } else {
                strapi.log.info('No contractorId provided, processing as platform-only payment');
            }

            // 3. Create payment intent
            const paymentIntent = await stripeService.createPaymentIntent({
                amount,
                contractorStripeAccountId,
                bookingId: bookingId || 'test_booking',
                customerId,
                currency: 'usd',
                captureMethod: 'manual', // Hold funds only
            });

            // 4. Update booking in Supabase if it exists
            if (bookingId && bookingId !== 'temp_booking' && bookingId !== 'temp_booking_id') {
                try {
                    await updateSupabaseBooking(bookingId, {
                        payment_intent_id: paymentIntent.paymentIntentId,
                        payment_status: 'authorized',
                    });
                    strapi.log.info(`✅ Updated Supabase booking ${bookingId} with payment intent ${paymentIntent.paymentIntentId}`);
                } catch (err) {
                    strapi.log.error(`❌ Failed to update Supabase booking ${bookingId} with payment intent: ${err.message}`);
                }
            }

            strapi.log.info(`Payment intent created (authorized): ${paymentIntent.paymentIntentId}`);

            ctx.body = {
                success: true,
                clientSecret: paymentIntent.clientSecret,
                paymentIntentId: paymentIntent.paymentIntentId,
                amount: paymentIntent.amount,
                platformFee: paymentIntent.platformFee,
                contractorAmount: paymentIntent.contractorAmount,
            };
        } catch (error) {
            strapi.log.error('Create payment intent error:', error);
            ctx.throw(500, `Failed to create payment intent: ${error.message}`);
        }
    },

    /**
     * Update a payment intent with booking ID and email
     * POST /api/payments/update-intent
     */
    async updateIntent(ctx) {
        try {
            const { paymentIntentId, bookingId, email } = ctx.request.body as any;

            if (!paymentIntentId) {
                return ctx.badRequest('Payment Intent ID is required');
            }

            const updateData: any = {
                metadata: {},
            };

            if (bookingId) updateData.metadata.bookingId = bookingId;
            if (email) updateData.receipt_email = email;

            const paymentIntent = await stripeService.updatePaymentIntent(paymentIntentId, updateData);

            ctx.body = {
                success: true,
                paymentIntentId: paymentIntent.id,
            };
        } catch (error) {
            strapi.log.error('Update payment intent error:', error);
            ctx.throw(500, `Failed to update payment intent: ${error.message}`);
        }
    },

    /**
     * Capture a previously authorized payment
     * POST /api/payments/capture
     */
    async capturePayment(ctx) {
        try {
            const { bookingId } = ctx.request.body as any;

            if (!bookingId) {
                return ctx.badRequest('Booking ID is required');
            }

            const booking = await getSupabaseBooking(bookingId);

            if (!booking || !booking.payment_intent_id) {
                return ctx.badRequest('Booking not found in Supabase or no payment intent');
            }

            if (booking.payment_status !== 'authorized') {
                return ctx.badRequest(`Booking status is ${booking.payment_status}, cannot capture`);
            }

            // Capture funds via Stripe
            const paymentIntent = await stripeService.capturePayment(booking.payment_intent_id);

            // Update booking in Supabase
            await updateSupabaseBooking(bookingId, {
                payment_status: 'paid',
                captured_at: new Date().toISOString(),
                paid_at: new Date().toISOString(),
            });

            ctx.body = {
                success: true,
                status: paymentIntent.status,
            };

        } catch (error) {
            strapi.log.error('Capture payment error:', error);
            ctx.throw(500, `Failed to capture payment: ${error.message}`);
        }
    },

    /**
     * Handle Stripe webhooks
     * POST /api/payments/webhook
     */
    async webhook(ctx) {
        const signature = ctx.request.headers['stripe-signature'];
        // Note: Strapi might need specialized handling for raw body depending on config
        const payload = (ctx.request.body as any)[Symbol.for('unparsedBody')] || ctx.request.body;

        try {
            // Verify webhook signature
            const event = stripeService.verifyWebhookSignature(payload, signature);

            strapi.log.info(`Webhook received: ${event.type}`);

            // Handle different event types
            switch (event.type) {
                case 'payment_intent.amount_capturable_updated':
                    // Funds are authorized and ready to capture
                    await handlePaymentAuthorized(event.data.object);
                    break;

                case 'payment_intent.succeeded':
                    await handlePaymentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await handlePaymentFailed(event.data.object);
                    break;

                case 'charge.refunded':
                    await handleRefund(event.data.object);
                    break;

                case 'account.updated':
                    await handleAccountUpdated(event.data.object);
                    break;

                default:
                    strapi.log.info(`Unhandled event type: ${event.type}`);
            }

            ctx.body = { received: true };
        } catch (error) {
            strapi.log.error('Webhook error:', error);
            ctx.throw(400, `Webhook error: ${error.message}`);
        }
    },

    /**
     * Calculate fees for an amount
     * POST /api/payments/calculate-fees
     */
    async calculateFees(ctx) {
        try {
            const { amount } = ctx.request.body as any;

            if (!amount || amount <= 0) {
                return ctx.badRequest('Invalid amount');
            }

            const fees = stripeService.calculateFees(amount);

            ctx.body = {
                success: true,
                ...fees,
            };
        } catch (error) {
            strapi.log.error('Calculate fees error:', error);
            ctx.throw(500, `Failed to calculate fees: ${error.message}`);
        }
    },
};

/**
 * Handle authorized payment (funds held)
 */
async function handlePaymentAuthorized(paymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    if (!bookingId || bookingId === 'test_booking') return;

    try {
        // Update booking status in Supabase
        await updateSupabaseBooking(bookingId, {
            payment_status: 'authorized',
            status: 'confirmed', // Confirmed but not yet paid (funds held)
        });

        strapi.log.info(`✅ Payment authorized for Supabase booking ${bookingId}`);

        // TODO: Send confirmation emails (Funds held)
        // TODO: Notify contractor via Resend/Supabase
    } catch (error) {
        strapi.log.error(`Failed to update Supabase booking ${bookingId}:`, error);
    }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    if (!bookingId || bookingId === 'test_booking') return;

    try {
        // Update booking status in Supabase
        await updateSupabaseBooking(bookingId, {
            payment_status: 'paid',
            status: 'confirmed',
            paid_at: new Date().toISOString(),
        });

        strapi.log.info(`✅ Payment succeeded for Supabase booking ${bookingId}`);

        // TODO: Send confirmation emails
        // TODO: Notify contractor
    } catch (error) {
        strapi.log.error(`Failed to update Supabase booking ${bookingId}:`, error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    if (!bookingId || bookingId === 'test_booking') return;

    const error = paymentIntent.last_payment_error;

    try {
        // Update booking status in Supabase
        await updateSupabaseBooking(bookingId, {
            payment_status: 'failed',
            payment_error: error?.message || 'Payment failed',
        });

        strapi.log.warn(`❌ Payment failed for Supabase booking ${bookingId}: ${error?.message}`);

        // TODO: Send failure notification
    } catch (error) {
        strapi.log.error(`Failed to update Supabase booking ${bookingId}:`, error);
    }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
    const { bookingId } = charge.metadata;
    if (!bookingId || bookingId === 'test_booking') return;

    try {
        // Update booking status in Supabase
        await updateSupabaseBooking(bookingId, {
            payment_status: 'refunded',
            refunded_at: new Date().toISOString(),
        });

        strapi.log.info(`💰 Refund processed for Supabase booking ${bookingId}`);

        // TODO: Send refund confirmation
    } catch (error) {
        strapi.log.error(`Failed to update Supabase booking ${bookingId}:`, error);
    }
}

/**
 * Handle Connect account update
 */
async function handleAccountUpdated(account) {
    try {
        // Find contractor in Strapi with this Stripe account
        const contractors = await (strapi as any).documents('api::contractor.contractor').findMany({
            filters: {
                stripeAccountId: account.id,
            },
        });

        if (contractors && contractors.length > 0) {
            const contractor = contractors[0];

            // Update contractor verification status in Strapi
            await (strapi as any).documents('api::contractor.contractor').update({
                documentId: contractor.documentId,
                data: {
                    stripeDetailsSubmitted: account.details_submitted,
                    stripeChargesEnabled: account.charges_enabled,
                    stripePayoutsEnabled: account.payouts_enabled,
                } as any,
            });

            strapi.log.info(`Updated Connect account status for Strapi contractor ${contractor.documentId}`);
        }
    } catch (error) {
        strapi.log.error('Failed to update contractor account status:', error);
    }
}
