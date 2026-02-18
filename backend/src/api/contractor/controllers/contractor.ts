/**
 * Contractor controller
 */

import { factories } from '@strapi/strapi';
import stripeService from '../../../services/stripe-service';

export default factories.createCoreController('api::contractor.contractor', ({ strapi }) => ({
    /**
     * Register a new contractor
     * Handles multi-part form data with file uploads
     */
    async register(ctx) {
        try {
            const { files } = ctx.request;
            const { fullName, email, phone, address, businessName, serviceZipCodes } = ctx.request.body;

            // Parse service ZIP codes
            const parsedZipCodes = JSON.parse(serviceZipCodes || '[]');

            // Check if contractor already exists
            const existing = await strapi.db.query('api::contractor.contractor').findOne({
                where: { email },
            });

            if (existing) {
                return ctx.badRequest('A contractor with this email already exists');
            }

            // Create contractor record
            const contractor = await strapi.entityService.create('api::contractor.contractor', {
                data: {
                    name: fullName,
                    email,
                    phone,
                    homeAddress: {
                        street: address,
                    },
                    status: 'pending',
                    stripeOnboardingComplete: false,
                },
            });

            // Upload documents to the contractor record
            if (files && contractor) {
                const uploadedFiles = [];

                if (files.driversLicense) {
                    uploadedFiles.push(files.driversLicense);
                }
                if (files.vehicleInsurance) {
                    uploadedFiles.push(files.vehicleInsurance);
                }
                if (files.businessLicense) {
                    uploadedFiles.push(files.businessLicense);
                }

                if (uploadedFiles.length > 0) {
                    await strapi.plugins.upload.services.upload.uploadToEntity(
                        {
                            id: contractor.id,
                            model: 'api::contractor.contractor',
                            field: 'documents',
                        },
                        uploadedFiles
                    );
                }
            }

            // TODO: Send notification to admin for approval
            // TODO: Send confirmation email to contractor

            ctx.body = {
                success: true,
                contractorId: contractor.id,
                message: 'Application submitted successfully',
            };
        } catch (error) {
            strapi.log.error('Contractor registration error:', error);
            ctx.throw(500, `Registration failed: ${error.message}`);
        }
    },

    /**
     * Get contractor dashboard data
     * Returns jobs, earnings, and schedule
     */
    async dashboard(ctx) {
        try {
            // TODO: Get contractor ID from authenticated user
            const contractorId = ctx.state.user?.contractor?.id;

            if (!contractorId) {
                return ctx.unauthorized('No contractor profile found');
            }

            // Get contractor details
            const contractor = await strapi.entityService.findOne(
                'api::contractor.contractor',
                contractorId,
                {
                    populate: ['serviceZones'],
                }
            );

            // Get active bookings
            const activeBookings = await strapi.db.query('api::booking.booking').findMany({
                where: {
                    contractor: contractorId,
                    status: {
                        $in: ['confirmed', 'in_progress'],
                    },
                },
                populate: ['service', 'customer'],
                orderBy: { scheduledDate: 'asc' },
            });

            // Get today's bookings
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayBookings = activeBookings.filter((booking) => {
                const bookingDate = new Date(booking.scheduledDate);
                return bookingDate >= today && bookingDate < tomorrow;
            });

            // Calculate earnings
            const completedBookings = await strapi.db.query('api::booking.booking').findMany({
                where: {
                    contractor: contractorId,
                    status: 'completed',
                    payoutStatus: 'paid',
                },
            });

            const totalEarnings = completedBookings.reduce((sum, booking) => {
                return sum + (booking.contractorEarnings || 0);
            }, 0);

            ctx.body = {
                contractor: {
                    name: contractor.name,
                    rating: contractor.averageRating,
                    totalJobs: contractor.totalJobs,
                    performanceTier: contractor.performanceTier,
                },
                todaySchedule: todayBookings,
                activeJobs: activeBookings.length,
                earnings: {
                    total: totalEarnings,
                    thisWeek: 0, // TODO: Calculate weekly earnings
                    thisMonth: 0, // TODO: Calculate monthly earnings
                },
            };
        } catch (error) {
            strapi.log.error('Dashboard fetch error:', error);
            ctx.throw(500, `Failed to fetch dashboard: ${error.message}`);
        }
    },

    /**
     * Accept a job assignment
     */
    async acceptJob(ctx) {
        try {
            const { bookingId } = ctx.params;
            const contractorId = ctx.state.user?.contractor?.id;

            if (!contractorId) {
                return ctx.unauthorized('No contractor profile found');
            }

            const booking = await strapi.entityService.findOne('api::booking.booking', bookingId);

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            if ((booking as any).contractor && (booking as any).contractor.id !== contractorId) {
                return ctx.forbidden('This job is not assigned to you');
            }

            // Update booking status
            const updatedBooking = await strapi.entityService.update(
                'api::booking.booking',
                bookingId,
                {
                    data: {
                        status: 'confirmed',
                        contractor: contractorId,
                        acceptedAt: new Date(),
                    },
                }
            );

            // Send contractor assignment email to customer
            try {
                const emailService = strapi.service('api::email.email');
                const bookingWithPopulate = await strapi.entityService.findOne(
                    'api::booking.booking',
                    bookingId,
                    { populate: ['customer', 'contractor', 'service'] }
                );
                await emailService.sendContractorAssignment(bookingWithPopulate);
                strapi.log.info(`Contractor assignment email sent for booking ${bookingId}`);
            } catch (emailError) {
                strapi.log.error('Failed to send contractor assignment email:', emailError);
            }

            ctx.body = {
                success: true,
                booking: updatedBooking,
            };
        } catch (error) {
            strapi.log.error('Accept job error:', error);
            ctx.throw(500, `Failed to accept job: ${error.message}`);
        }
    },

    /**
     * Reject a job assignment
     */
    async rejectJob(ctx) {
        try {
            const { bookingId } = ctx.params;
            const contractorId = ctx.state.user?.contractor?.id;

            if (!contractorId) {
                return ctx.unauthorized('No contractor profile found');
            }

            const { reason } = ctx.request.body;

            const booking = await strapi.entityService.findOne('api::booking.booking', bookingId);

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            if ((booking as any).contractor && (booking as any).contractor.id !== contractorId) {
                return ctx.forbidden('This job is not assigned to you');
            }

            // Update booking to find another contractor
            const updatedBooking = await strapi.entityService.update(
                'api::booking.booking',
                bookingId,
                {
                    data: {
                        status: 'pending_assignment',
                        contractor: null,
                        rejectionReason: reason,
                    },
                }
            );

            // TODO: Trigger reassignment logic
            // TODO: Notify admin of rejection

            ctx.body = {
                success: true,
                message: 'Job rejected. It will be reassigned to another contractor.',
            };
        } catch (error) {
            strapi.log.error('Reject job error:', error);
            ctx.throw(500, `Failed to reject job: ${error.message}`);
        }
    },
    /**
     * Complete a job with checklist and photos
     * Triggers payment capture
     */
    async completeJob(ctx) {
        try {
            const { bookingId } = ctx.params;
            const contractorId = ctx.state.user?.contractor?.id;
            const { files } = ctx.request;
            const { checklist } = ctx.request.body;

            if (!contractorId) {
                return ctx.unauthorized('No contractor profile found');
            }

            const booking = await strapi.entityService.findOne('api::booking.booking', bookingId, {
                populate: ['contractor'],
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            if ((booking as any).contractor?.id !== contractorId) {
                return ctx.forbidden('This job is not assigned to you');
            }

            if (booking.status === 'completed') {
                return ctx.badRequest('This job is already completed');
            }

            // Upload before/after photos
            if (files) {
                const beforeFiles = [];
                const afterFiles = [];

                // Detect before/after photos by field name
                for (const key in files) {
                    const file = files[key];
                    if (key.toLowerCase().includes('before')) {
                        if (Array.isArray(file)) beforeFiles.push(...file);
                        else beforeFiles.push(file);
                    } else if (key.toLowerCase().includes('after')) {
                        if (Array.isArray(file)) afterFiles.push(...file);
                        else afterFiles.push(file);
                    }
                }

                if (beforeFiles.length > 0) {
                    await strapi.plugins.upload.services.upload.uploadToEntity(
                        {
                            id: bookingId,
                            model: 'api::booking.booking',
                            field: 'beforePhotos',
                        },
                        beforeFiles
                    );
                }

                if (afterFiles.length > 0) {
                    await strapi.plugins.upload.services.upload.uploadToEntity(
                        {
                            id: bookingId,
                            model: 'api::booking.booking',
                            field: 'afterPhotos',
                        },
                        afterFiles
                    );
                }
            }

            // Update booking status
            const updatedBooking = await strapi.entityService.update(
                'api::booking.booking',
                bookingId,
                {
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                        checklistCompleted: JSON.parse(checklist || '{}'),
                    },
                }
            );

            // Capture payment via Stripe
            if (booking.paymentIntentId) {
                try {
                    await stripeService.capturePayment(booking.paymentIntentId);

                    // Update payment status
                    await strapi.entityService.update('api::booking.booking', bookingId, {
                        data: {
                            paymentStatus: 'captured',
                        },
                    });
                } catch (stripeError) {
                    strapi.log.error('Payment capture failed:', stripeError);
                    // Don't fail the whole operation if payment capture fails
                    // Admin can manually capture later
                }
            }

            // Send service completion email to customer
            try {
                const emailService = strapi.service('api::email.email');
                const bookingWithPopulate = await strapi.entityService.findOne(
                    'api::booking.booking',
                    bookingId,
                    { populate: ['customer', 'contractor', 'service', 'beforePhotos', 'afterPhotos'] }
                );

                await emailService.sendServiceCompletion(bookingWithPopulate);
                strapi.log.info(`Service completion email sent for booking ${bookingId}`);

                // Also send auto-approval warning (24 hours reminder)
                await emailService.sendAutoApprovalWarning(bookingWithPopulate, 24);
                strapi.log.info(`Auto-approval warning email sent for booking ${bookingId}`);
            } catch (emailError) {
                strapi.log.error('Failed to send completion emails:', emailError);
            }

            ctx.body = {
                success: true,
                booking: updatedBooking,
                message: 'Service completed successfully',
            };
        } catch (error) {
            strapi.log.error('Complete job error:', error);
            ctx.throw(500, `Failed to complete job: ${error.message}`);
        }
    },

    /**
     * Initiate Stripe Connect onboarding
     */
    async onboard(ctx) {
        try {
            // Get contractor from authenticated user
            // Note: In Strapi, relations in ctx.state.user might need population
            const user = ctx.state.user;
            if (!user) {
                return ctx.unauthorized('Authentication required');
            }

            // Find contractor associated with this user
            // Assuming 1:1 relation between User and Contractor
            const contractors = await strapi.documents('api::contractor.contractor' as any).findMany({
                filters: {
                    user: user.id
                }
            });

            if (!contractors || contractors.length === 0) {
                return ctx.notFound('Contractor profile not found for this user');
            }

            const contractor = contractors[0];
            let stripeAccountId = contractor.stripeAccountId;

            // 1. Create Stripe account if it doesn't exist
            if (!stripeAccountId) {
                const { accountId } = await stripeService.createConnectAccount({
                    email: contractor.email,
                    metadata: {
                        contractorId: contractor.documentId,
                    },
                });

                stripeAccountId = accountId;

                // Save Stripe Account ID to contractor
                await strapi.documents('api::contractor.contractor' as any).update({
                    documentId: contractor.documentId,
                    data: { stripeAccountId }
                });
            }

            // 2. Create Boarding Link
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const refreshUrl = `${frontendUrl}/contractor/settings?onboarding_refresh=true`;
            const returnUrl = `${frontendUrl}/contractor/settings?onboarding_complete=true`;

            const onboardingUrl = await stripeService.createAccountLink(
                stripeAccountId,
                refreshUrl,
                returnUrl
            );

            ctx.body = {
                success: true,
                url: onboardingUrl,
                stripeAccountId
            };
        } catch (error) {
            strapi.log.error('Contractor onboarding error:', error);
            ctx.throw(500, `Failed to initiate onboarding: ${error.message}`);
        }
    },

    /**
     * Check Stripe onboarding status
     */
    async onboardingStatus(ctx) {
        try {
            const user = ctx.state.user;
            if (!user) {
                return ctx.unauthorized('Authentication required');
            }

            const contractors = await strapi.documents('api::contractor.contractor' as any).findMany({
                filters: {
                    user: user.id
                }
            });

            if (!contractors || contractors.length === 0) {
                return ctx.notFound('Contractor profile not found');
            }

            const contractor = contractors[0];

            if (!contractor.stripeAccountId) {
                return ctx.body = {
                    success: true,
                    onboardingComplete: false,
                    detailsSubmitted: false,
                    needsAccount: true
                };
            }

            // Fetch fresh status from Stripe
            const account = await stripeService.getConnectAccount(contractor.stripeAccountId);

            // Update local record to stay in sync
            await strapi.documents('api::contractor.contractor' as any).update({
                documentId: contractor.documentId,
                data: {
                    stripeDetailsSubmitted: account.detailsSubmitted,
                    stripeChargesEnabled: account.chargesEnabled,
                    stripePayoutsEnabled: account.payoutsEnabled,
                    stripeOnboardingComplete: account.detailsSubmitted && account.chargesEnabled
                }
            });

            ctx.body = {
                success: true,
                onboardingComplete: account.detailsSubmitted && account.chargesEnabled,
                detailsSubmitted: account.detailsSubmitted,
                chargesEnabled: account.chargesEnabled,
                payoutsEnabled: account.payoutsEnabled,
                requirements: account.requirements
            };
        } catch (error) {
            strapi.log.error('Check onboarding status error:', error);
            ctx.throw(500, `Failed to check status: ${error.message}`);
        }
    }
}));
