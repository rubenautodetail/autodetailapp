import Strapi from '@strapi/strapi';

export default {
    /**
     * Cron job to auto-approve bookings after 24 hours
     * Runs every hour to check for completed bookings that need auto-approval
     */
    '0 * * * *': async ({ strapi }) => {
        try {
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Find bookings completed >24hrs ago that are not approved/auto-approved
            const bookingsToApprove = await strapi.entityService.findMany(
                'api::booking.booking',
                {
                    filters: {
                        status: 'completed',
                        completedAt: {
                            $lte: twentyFourHoursAgo,
                        },
                        $or: [
                            { approvalStatus: { $null: true } },
                            { approvalStatus: { $ne: 'approved' } },
                        ],
                    },
                    populate: ['customer', 'contractor', 'service'],
                }
            );

            strapi.log.info(
                `Auto-approval job: Found ${bookingsToApprove.length} bookings to auto-approve`
            );

            for (const booking of bookingsToApprove) {
                try {
                    // Capture payment
                    if (booking.paymentIntentId && booking.paymentStatus !== 'captured') {
                        const stripeService = strapi.service('plugin::stripe.stripe');
                        await stripeService.capturePaymentIntent(booking.paymentIntentId);
                    }

                    // Update booking
                    await strapi.entityService.update('api::booking.booking', booking.id, {
                        data: {
                            approvalStatus: 'auto_approved',
                            approvedAt: new Date(),
                            paymentStatus: 'captured',
                        },
                    });

                    // Send receipt email
                    const emailService = strapi.service('api::email.email');
                    await emailService.sendPaymentReceipt(booking);

                    strapi.log.info(`Auto-approved booking ${booking.id}`);
                } catch (error) {
                    strapi.log.error(`Failed to auto-approve booking ${booking.id}:`, error);
                }
            }
        } catch (error) {
            strapi.log.error('Auto-approval cron job failed:', error);
        }
    },
};
