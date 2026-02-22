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

            // Validate required fields
            if (!fullName || !email || !phone) {
                return ctx.badRequest('Full name, email, and phone are required');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return ctx.badRequest('Invalid email address');
            }

            // Validate phone format (basic check for 10 digits)
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                return ctx.badRequest('Invalid phone number');
            }

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
                    performanceTier: 'standard',
                    averageRating: 0,
                    totalJobs: 0,
                    completionRate: 1.0,
                },
            });

            // Track uploaded files for admin notification
            const uploadedFiles = [];

            // Upload documents to the contractor record
            if (files && contractor) {

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

            // Send confirmation email to contractor (non-blocking)
            try {
                await sendContractorRegistrationConfirmation(strapi, contractor);
                strapi.log.info(`📧 Registration confirmation sent to ${email}`);
            } catch (emailError) {
                strapi.log.error('Failed to send contractor confirmation email:', emailError);
                // Don't fail registration if email fails
            }

            // Send notification to admin (non-blocking)
            try {
                await sendAdminNotification(strapi, contractor, uploadedFiles.length);
                strapi.log.info(`📧 Admin notification sent for new contractor ${fullName}`);
            } catch (emailError) {
                strapi.log.error('Failed to send admin notification:', emailError);
                // Don't fail registration if email fails
            }

            strapi.log.info(`✅ New contractor registered: ${fullName} (${email}) - Status: pending`);

            ctx.body = {
                success: true,
                contractorId: contractor.id,
                message: 'Application submitted successfully! We will review your application and contact you within 2-3 business days.',
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
     * Admin: List all contractors (filterable by status)
     */
    async adminList(ctx) {
        try {
            const { status, page = 1, pageSize = 20 } = ctx.query;

            const filters: any = {};
            if (status) filters.status = status;

            const [contractors, total] = await Promise.all([
                strapi.db.query('api::contractor.contractor').findMany({
                    where: filters,
                    orderBy: { createdAt: 'desc' },
                    offset: (Number(page) - 1) * Number(pageSize),
                    limit: Number(pageSize),
                    populate: ['documents'],
                }),
                strapi.db.query('api::contractor.contractor').count({ where: filters }),
            ]);

            ctx.body = {
                data: contractors,
                meta: { total, page: Number(page), pageSize: Number(pageSize) },
            };
        } catch (error) {
            strapi.log.error('Admin list contractors error:', error);
            ctx.throw(500, `Failed to fetch contractors: ${error.message}`);
        }
    },

    /**
     * Admin: Approve a contractor — set status to active and send onboarding email
     */
    async adminApprove(ctx) {
        try {
            const { id } = ctx.params;

            const contractor = await strapi.entityService.findOne(
                'api::contractor.contractor', id
            );
            if (!contractor) return ctx.notFound('Contractor not found');
            if (contractor.status === 'active') {
                return ctx.badRequest('Contractor is already active');
            }

            const updated = await strapi.entityService.update(
                'api::contractor.contractor', id,
                { data: { status: 'active', approvedAt: new Date() } }
            );

            // Notify contractor of approval
            try {
                const { Resend } = require('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'noreply@rubensautodetail.com',
                    to: contractor.email,
                    subject: '🎉 Congratulations! You\'re Approved — Rubens Auto Detail',
                    html: `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}
.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none}
.footer{background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 10px 10px}
.btn{display:inline-block;background:#10b981;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
</style></head><body>
<div class="container">
  <div class="header"><h1 style="margin:0">🎉 You\'re Approved!</h1></div>
  <div class="content">
    <h2>Hi ${contractor.name},</h2>
    <p>Great news — your application to join Rubens Auto Detail has been <strong>approved!</strong></p>
    <p>The next step is to connect your bank account through Stripe so you can receive payments. It only takes a few minutes.</p>
    <div style="text-align:center">
      <a href="${frontendUrl}/en/contractor/settings" class="btn">Connect Bank Account →</a>
    </div>
    <p style="color:#6b7280;font-size:14px">Once your bank account is connected, you\'ll start receiving job assignments right away.</p>
  </div>
  <div class="footer"><p>© ${new Date().getFullYear()} Rubens Auto Detail</p></div>
</div>
</body></html>`,
                });
                strapi.log.info(`Approval email sent to ${contractor.email}`);
            } catch (emailError) {
                strapi.log.error('Failed to send approval email:', emailError);
            }

            ctx.body = { success: true, contractor: updated };
        } catch (error) {
            strapi.log.error('Admin approve contractor error:', error);
            ctx.throw(500, `Failed to approve contractor: ${error.message}`);
        }
    },

    /**
     * Admin: Reject a contractor application
     */
    async adminReject(ctx) {
        try {
            const { id } = ctx.params;
            const { reason } = ctx.request.body;

            const contractor = await strapi.entityService.findOne(
                'api::contractor.contractor', id
            );
            if (!contractor) return ctx.notFound('Contractor not found');

            const updated = await strapi.entityService.update(
                'api::contractor.contractor', id,
                { data: { status: 'rejected' } as any }
            );

            // Notify contractor of rejection
            try {
                const { Resend } = require('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'noreply@rubensautodetail.com',
                    to: contractor.email,
                    subject: 'Application Update — Rubens Auto Detail',
                    html: `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#6b7280,#374151);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}
.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none}
.footer{background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 10px 10px}
</style></head><body>
<div class="container">
  <div class="header"><h1 style="margin:0">Application Update</h1></div>
  <div class="content">
    <h2>Hi ${contractor.name},</h2>
    <p>Thank you for your interest in joining Rubens Auto Detail. After reviewing your application, we\'re unable to move forward at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>You\'re welcome to reapply in the future if your circumstances change. If you have questions, please contact us at support@rubensautodetail.com.</p>
  </div>
  <div class="footer"><p>© ${new Date().getFullYear()} Rubens Auto Detail</p></div>
</div>
</body></html>`,
                });
                strapi.log.info(`Rejection email sent to ${contractor.email}`);
            } catch (emailError) {
                strapi.log.error('Failed to send rejection email:', emailError);
            }

            ctx.body = { success: true, contractor: updated };
        } catch (error) {
            strapi.log.error('Admin reject contractor error:', error);
            ctx.throw(500, `Failed to reject contractor: ${error.message}`);
        }
    },

    /**
     * Admin: List all bookings
     */
    async adminBookings(ctx) {
        try {
            const { status, page = 1, pageSize = 20 } = ctx.query;

            const filters: any = {};
            if (status) filters.status = status;

            const [bookings, total] = await Promise.all([
                strapi.db.query('api::booking.booking').findMany({
                    where: filters,
                    orderBy: { createdAt: 'desc' },
                    offset: (Number(page) - 1) * Number(pageSize),
                    limit: Number(pageSize),
                    populate: ['service', 'contractor'],
                }),
                strapi.db.query('api::booking.booking').count({ where: filters }),
            ]);

            ctx.body = {
                data: bookings,
                meta: { total, page: Number(page), pageSize: Number(pageSize) },
            };
        } catch (error) {
            strapi.log.error('Admin list bookings error:', error);
            ctx.throw(500, `Failed to fetch bookings: ${error.message}`);
        }
    },

    /**
     * Admin: Get platform stats overview
     */
    async adminStats(ctx) {
        try {
            const [
                totalContractors,
                pendingContractors,
                activeContractors,
                totalBookings,
                pendingBookings,
                completedBookings,
            ] = await Promise.all([
                strapi.db.query('api::contractor.contractor').count({}),
                strapi.db.query('api::contractor.contractor').count({ where: { status: 'pending' } }),
                strapi.db.query('api::contractor.contractor').count({ where: { status: 'active' } }),
                strapi.db.query('api::booking.booking').count({}),
                strapi.db.query('api::booking.booking').count({ where: { status: { $in: ['pending', 'pending_assignment', 'confirmed'] } } }),
                strapi.db.query('api::booking.booking').count({ where: { status: 'completed' } }),
            ]);

            // Approximate revenue (completed bookings × average total)
            const recentCompleted = await strapi.db.query('api::booking.booking').findMany({
                where: { status: 'completed' },
                select: ['total'],
                limit: 1000,
            });
            const totalRevenue = recentCompleted.reduce((sum, b) => sum + (b.total || 0), 0);

            ctx.body = {
                contractors: { total: totalContractors, pending: pendingContractors, active: activeContractors },
                bookings: { total: totalBookings, pending: pendingBookings, completed: completedBookings },
                revenue: { total: totalRevenue },
            };
        } catch (error) {
            strapi.log.error('Admin stats error:', error);
            ctx.throw(500, `Failed to fetch stats: ${error.message}`);
        }
    },

    /**
     * Admin: Manually create a contractor (bypasses self-registration flow)
     * POST /api/admin/contractors
     */
    async adminCreate(ctx) {
        try {
            const { name, email, phone, status } = ctx.request.body;

            if (!name || !email || !phone) {
                return ctx.badRequest('Name, email, and phone are required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return ctx.badRequest('Invalid email address');
            }

            const existing = await strapi.db.query('api::contractor.contractor').findOne({ where: { email } });
            if (existing) {
                return ctx.badRequest('A contractor with this email already exists');
            }

            const contractor = await strapi.entityService.create('api::contractor.contractor', {
                data: {
                    name,
                    email,
                    phone,
                    status: status || 'active',
                    stripeOnboardingComplete: false,
                    performanceTier: 'standard',
                    averageRating: 0,
                    totalJobs: 0,
                    completionRate: 1.0,
                } as any,
            });

            strapi.log.info(`✅ Admin manually created contractor: ${name} (${email})`);

            ctx.body = { success: true, contractor };
        } catch (error) {
            strapi.log.error('Admin create contractor error:', error);
            ctx.throw(500, `Failed to create contractor: ${error.message}`);
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

/**
 * Send registration confirmation email to contractor
 */
async function sendContractorRegistrationConfirmation(strapi: any, contractor: any) {
    try {
        const emailService = strapi.service('api::email.email');

        // Use the resend service to send a beautiful HTML email
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@rubensautodetail.com',
            to: contractor.email,
            subject: 'Application Received - Rubens Auto Detail',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 4px; font-weight: 600; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚗 Welcome to Rubens Auto Detail!</h1>
        </div>

        <div class="content">
            <h2>Hi ${contractor.name},</h2>

            <p>Thank you for your interest in joining our team of professional auto detailers! We've successfully received your application.</p>

            <div class="info-box">
                <strong>Application Status:</strong> <span class="status-badge">Pending Review</span>
            </div>

            <h3>What Happens Next?</h3>
            <ol>
                <li><strong>Review Process</strong> - Our team will review your application and documents within 2-3 business days</li>
                <li><strong>Background Check</strong> - We'll verify your credentials and conduct a background check</li>
                <li><strong>Onboarding</strong> - Once approved, you'll receive instructions to complete your Stripe Connect onboarding</li>
                <li><strong>Start Earning</strong> - Begin accepting jobs and earning money!</li>
            </ol>

            <h3>Your Application Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${contractor.name}</li>
                <li><strong>Email:</strong> ${contractor.email}</li>
                <li><strong>Phone:</strong> ${contractor.phone}</li>
                <li><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>

            <p style="margin-top: 30px;">We'll notify you via email as soon as we've reviewed your application. If you have any questions in the meantime, feel free to reach out to us.</p>

            <p><strong>Questions?</strong> Reply to this email or contact us at support@rubensautodetail.com</p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} Rubens Auto Detail. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            throw new Error(`Resend error: ${error.message}`);
        }

        return data;
    } catch (error) {
        strapi.log.error('Failed to send contractor registration confirmation:', error);
        throw error;
    }
}

/**
 * Send admin notification about new contractor registration
 */
async function sendAdminNotification(strapi: any, contractor: any, documentCount: number) {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@rubensautodetail.com';

        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@rubensautodetail.com',
            to: adminEmail,
            subject: `🚨 New Contractor Application - ${contractor.name}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: #f9fafb; padding: 15px; border-radius: 6px; }
        .info-item strong { display: block; color: #6b7280; font-size: 12px; margin-bottom: 5px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚨 New Contractor Application</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
        </div>

        <div class="content">
            <div class="alert-box">
                <strong>⚡ A new contractor has submitted an application and is awaiting review.</strong>
            </div>

            <h3>Contractor Details:</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>FULL NAME</strong>
                    ${contractor.name}
                </div>
                <div class="info-item">
                    <strong>EMAIL</strong>
                    ${contractor.email}
                </div>
                <div class="info-item">
                    <strong>PHONE</strong>
                    ${contractor.phone}
                </div>
                <div class="info-item">
                    <strong>STATUS</strong>
                    Pending
                </div>
                <div class="info-item">
                    <strong>HOME ADDRESS</strong>
                    ${contractor.homeAddress?.street || 'Not provided'}
                </div>
                <div class="info-item">
                    <strong>DOCUMENTS</strong>
                    ${documentCount} file(s) uploaded
                </div>
            </div>

            <h3>Next Steps:</h3>
            <ol>
                <li>Review contractor information and uploaded documents</li>
                <li>Verify credentials and conduct background check</li>
                <li>Approve or reject the application in the admin dashboard</li>
                <li>If approved, contractor will receive Stripe Connect onboarding link</li>
            </ol>

            <div style="text-align: center;">
                <a href="${process.env.ADMIN_DASHBOARD_URL || 'https://admin.rubensautodetail.com'}/contractors/${contractor.id}" class="button">
                    Review Application →
                </a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
                <strong>Application ID:</strong> ${contractor.id}
            </p>
        </div>

        <div class="footer">
            <p>© ${new Date().getFullYear()} Rubens Auto Detail Admin Portal</p>
            <p>This is an automated notification from the contractor registration system.</p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            throw new Error(`Resend error: ${error.message}`);
        }

        return data;
    } catch (error) {
        strapi.log.error('Failed to send admin notification:', error);
        throw error;
    }
}
