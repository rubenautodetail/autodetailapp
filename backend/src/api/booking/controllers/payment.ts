/**
 * Payment controller
 * Handles Stripe payment intent creation and confirmation
 */

import { factories } from '@strapi/strapi';
import { createPaymentIntent } from '../../../services/stripe';

export default factories.createCoreController('api::booking.booking', ({ strapi }) => ({
    /**
     * Create a payment intent for a booking
     * POST /api/bookings/:id/create-payment-intent
     */
    async createPaymentIntent(ctx) {
        try {
            const { id } = ctx.params;

            // Get the booking
            const booking: any = await strapi.entityService.findOne('api::booking.booking', id, {
                populate: {
                    service: true,
                    addOns: true,
                    contractor: true,
                    customer: true,
                },
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            // Verify booking is in correct state
            if (booking.status !== 'pending') {
                return ctx.badRequest('Booking is not in pending state');
            }

            // Verify contractor has Stripe account
            if (!booking.contractor?.stripeAccountId) {
                return ctx.badRequest('Contractor does not have a Stripe account');
            }

            // Calculate total amount
            let totalAmount = booking.service?.basePrice || 0;

            // Add add-ons
            if (booking.addOns && booking.addOns.length > 0) {
                booking.addOns.forEach((addOn: any) => {
                    totalAmount += addOn.price || 0;
                });
            }

            // Convert to cents
            const amountInCents = Math.round(totalAmount * 100);

            // Create payment intent
            const paymentIntent = await createPaymentIntent(
                amountInCents,
                booking.contractor.stripeAccountId,
                {
                    bookingId: booking.id.toString(),
                    customerId: booking.customer?.id?.toString() || 'guest',
                    contractorId: booking.contractor.id.toString(),
                    service: booking.service.name,
                    date: booking.date,
                    timeWindow: booking.timeWindow,
                }
            );

            // Update booking with payment intent ID
            await strapi.entityService.update('api::booking.booking', id, {
                data: {
                    paymentIntentId: paymentIntent.id,
                    totalAmount: totalAmount,
                },
            });

            // Return client secret to frontend
            ctx.body = {
                clientSecret: paymentIntent.client_secret,
                amount: totalAmount,
                amountInCents: amountInCents,
                platformFee: Math.round(amountInCents * parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15')),
                contractorAmount: amountInCents - Math.round(amountInCents * parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15')),
            };
        } catch (error: any) {
            strapi.log.error('Error creating payment intent:', error);
            ctx.throw(500, `Failed to create payment intent: ${error.message}`);
        }
    },

    /**
     * Confirm payment was successful
     * POST /api/bookings/:id/confirm-payment
     */
    async confirmPayment(ctx) {
        try {
            const { id } = ctx.params;
            const { paymentIntentId } = ctx.request.body;

            if (!paymentIntentId) {
                return ctx.badRequest('Payment intent ID is required');
            }

            // Get the booking
            const booking: any = await strapi.entityService.findOne('api::booking.booking', id, {
                populate: {
                    service: true,
                    contractor: true,
                    customer: true,
                },
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            // Verify payment intent matches
            if (booking.paymentIntentId !== paymentIntentId) {
                return ctx.badRequest('Payment intent ID does not match booking');
            }

            // Update booking status
            await strapi.entityService.update('api::booking.booking', id, {
                data: {
                    status: 'confirmed',
                    paidAt: new Date(),
                },
            });

            // TODO: Send confirmation notifications
            // - Email to customer
            // - SMS to customer
            // - Notification to contractor
            // - Notification to admin

            ctx.body = {
                success: true,
                booking: {
                    id: booking.id,
                    status: 'confirmed',
                    confirmationCode: `DTL-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${booking.id}`,
                },
            };
        } catch (error: any) {
            strapi.log.error('Error confirming payment:', error);
            ctx.throw(500, `Failed to confirm payment: ${error.message}`);
        }
    },

    /**
     * Calculate booking price
     * POST /api/bookings/calculate-price
     */
    async calculatePrice(ctx) {
        try {
            const { serviceId, addOnIds, zipCode } = ctx.request.body;

            if (!serviceId) {
                return ctx.badRequest('Service ID is required');
            }

            // Get service
            const service: any = await strapi.entityService.findOne('api::service.service', serviceId);

            if (!service) {
                return ctx.notFound('Service not found');
            }

            let subtotal = service.basePrice || 0;

            // Add add-ons
            const addOns = [];
            if (addOnIds && addOnIds.length > 0) {
                for (const addOnId of addOnIds) {
                    const addOn = await strapi.entityService.findOne('api::add-on.add-on', addOnId);
                    if (addOn) {
                        subtotal += addOn.price || 0;
                        addOns.push({
                            id: addOn.id,
                            name: addOn.name,
                            price: addOn.price,
                        });
                    }
                }
            }

            // TODO: Apply zone-specific pricing multiplier if needed
            // const zone = await strapi.db.query('api::service-zone.service-zone').findOne({
            //   where: { zipCode: zipCode }
            // });
            // if (zone && zone.priceMultiplier) {
            //   subtotal *= zone.priceMultiplier;
            // }

            const serviceFee = subtotal * 0.05; // 5% service fee shown to customer
            const total = subtotal + serviceFee;

            ctx.body = {
                service: {
                    id: service.id,
                    name: service.name,
                    basePrice: service.basePrice,
                },
                addOns: addOns,
                subtotal: subtotal,
                serviceFee: serviceFee,
                total: total,
                currency: 'USD',
            };
        } catch (error: any) {
            strapi.log.error('Error calculating price:', error);
            ctx.throw(500, `Failed to calculate price: ${error.message}`);
        }
    },
}));
