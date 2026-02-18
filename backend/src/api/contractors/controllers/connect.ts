/**
 * Contractor Connect Controller
 * Handles Stripe Connect onboarding for contractors
 */

import stripeService from '../../../services/stripe-service';

export default {
    /**
     * Create a Stripe Connect account for a contractor
     * POST /api/contractors/create-connect-account
     */
    async createConnectAccount(ctx) {
        try {
            const { contractorId, email, businessType } = ctx.request.body as any;

            // Validate input
            if (!contractorId || !email) {
                return ctx.badRequest('Missing required fields: contractorId, email');
            }

            // Get contractor
            const contractor = await strapi.documents('api::contractor.contractor').findOne({
                documentId: contractorId,
            });

            if (!contractor) {
                return ctx.notFound('Contractor not found');
            }

            // Check if contractor already has a Stripe account
            if (contractor.stripeAccountId) {
                return ctx.badRequest('Contractor already has a Stripe account');
            }

            // Create Stripe Connect account
            const account = await stripeService.createConnectAccount({
                email,
                businessType: businessType || 'individual',
                country: 'US',
                metadata: {
                    contractorId,
                },
            });

            // Update contractor with Stripe account ID
            await strapi.documents('api::contractor.contractor').update({
                documentId: contractorId,
                data: {
                    stripeAccountId: account.accountId,
                    stripeDetailsSubmitted: account.detailsSubmitted,
                    stripeChargesEnabled: account.chargesEnabled,
                    stripePayoutsEnabled: account.payoutsEnabled,
                } as any,
            });

            strapi.log.info(`Connect account created for contractor ${contractorId}`);

            ctx.body = {
                success: true,
                accountId: account.accountId,
            };
        } catch (error) {
            strapi.log.error('Create Connect account error:', error);
            ctx.throw(500, `Failed to create Connect account: ${error.message}`);
        }
    },

    /**
     * Create an onboarding link for a contractor
     * POST /api/contractors/create-onboarding-link
     */
    async createOnboardingLink(ctx) {
        try {
            const { contractorId } = ctx.request.body as any;

            if (!contractorId) {
                return ctx.badRequest('Missing contractorId');
            }

            // Get contractor
            const contractor = await strapi.documents('api::contractor.contractor').findOne({
                documentId: contractorId,
            });

            if (!contractor) {
                return ctx.notFound('Contractor not found');
            }

            if (!contractor.stripeAccountId) {
                return ctx.badRequest('Contractor does not have a Stripe account. Create one first.');
            }

            // Create account link
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const refreshUrl = `${baseUrl}/contractor/onboarding?refresh=true`;
            const returnUrl = `${baseUrl}/contractor/onboarding/complete`;

            const onboardingUrl = await stripeService.createAccountLink(
                contractor.stripeAccountId,
                refreshUrl,
                returnUrl
            );

            ctx.body = {
                success: true,
                url: onboardingUrl,
            };
        } catch (error) {
            strapi.log.error('Create onboarding link error:', error);
            ctx.throw(500, `Failed to create onboarding link: ${error.message}`);
        }
    },

    /**
     * Get Connect account status
     * GET /api/contractors/:id/connect-status
     */
    async getConnectStatus(ctx) {
        try {
            const { id } = ctx.params;

            // Get contractor
            const contractor = await strapi.documents('api::contractor.contractor').findOne({
                documentId: id,
            });

            if (!contractor) {
                return ctx.notFound('Contractor not found');
            }

            if (!contractor.stripeAccountId) {
                return ctx.body = {
                    hasAccount: false,
                    detailsSubmitted: false,
                    chargesEnabled: false,
                    payoutsEnabled: false,
                };
            }

            // Get account details from Stripe
            const account = await stripeService.getConnectAccount(contractor.stripeAccountId);

            // Update contractor with latest status
            await strapi.documents('api::contractor.contractor').update({
                documentId: id,
                data: {
                    stripeDetailsSubmitted: account.detailsSubmitted,
                    stripeChargesEnabled: account.chargesEnabled,
                    stripePayoutsEnabled: account.payoutsEnabled,
                } as any,
            });

            ctx.body = {
                hasAccount: true,
                accountId: account.accountId,
                detailsSubmitted: account.detailsSubmitted,
                chargesEnabled: account.chargesEnabled,
                payoutsEnabled: account.payoutsEnabled,
                requirements: account.requirements,
            };
        } catch (error) {
            strapi.log.error('Get Connect status error:', error);
            ctx.throw(500, `Failed to get Connect status: ${error.message}`);
        }
    },
};
