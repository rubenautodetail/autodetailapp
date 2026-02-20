import { factories } from '@strapi/strapi';
import { assignContractor, markSlotAsBooked } from '../services/assignment-algorithm';

export default factories.createCoreController('api::booking.booking', ({ strapi }) => ({
    /**
     * Manually trigger contractor assignment for a booking
     * POST /api/assignments/assign/:bookingId
     */
    async assignToBooking(ctx) {
        try {
            const { bookingId } = ctx.params;

            if (!bookingId) {
                return ctx.badRequest('Booking ID is required');
            }

            // Get booking details
            const booking: any = await strapi.entityService.findOne('api::booking.booking', bookingId, {
                populate: ['service', 'contractor'],
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            // Check if already assigned
            if (booking.contractor?.id) {
                return ctx.badRequest('Booking already has a contractor assigned');
            }

            // Check if booking is in correct status
            if (!['pending', 'pending_assignment'].includes(booking.status)) {
                return ctx.badRequest(`Cannot assign contractor to booking with status: ${booking.status}`);
            }

            // Extract service location
            const serviceAddress: any = booking.serviceAddress || {};
            const serviceLatitude = serviceAddress.latitude;
            const serviceLongitude = serviceAddress.longitude;

            // Run assignment algorithm
            const result = await assignContractor(strapi, Number(bookingId), {
                zipCode: String(booking.zipCode),
                scheduledDate: String(booking.scheduledDate || booking.date),
                timeWindow: booking.timeWindow as any,
                serviceLatitude,
                serviceLongitude,
                serviceDuration: booking.service?.durationMinutes,
            });

            if (!result) {
                // No contractor found
                await strapi.entityService.update('api::booking.booking', bookingId, {
                    data: {
                        status: 'pending_assignment',
                    },
                });

                return ctx.send({
                    success: false,
                    message: 'No available contractor found',
                    booking: {
                        id: booking.id,
                        status: 'pending_assignment',
                    },
                });
            }

            // Update booking with assigned contractor
            const updatedBooking = await strapi.entityService.update('api::booking.booking', bookingId, {
                data: {
                    contractor: result.contractorId,
                    status: 'confirmed',
                    acceptedAt: new Date(),
                },
                populate: ['contractor'],
            });

            // Mark contractor's time slot as booked
            await markSlotAsBooked(
                strapi,
                result.contractorId,
                String(booking.scheduledDate || booking.date),
                booking.timeWindow as any
            );

            strapi.log.info(`[Assignment] Successfully assigned contractor ${result.contractorId} to booking ${bookingId}`);

            // TODO: Send notification to contractor
            // await strapi.service('api::email.email').sendNewJobAssigned(updatedBooking);

            return ctx.send({
                success: true,
                message: 'Contractor assigned successfully',
                booking: {
                    id: updatedBooking.id,
                    confirmationCode: updatedBooking.confirmationCode,
                    status: updatedBooking.status,
                    contractor: {
                        id: (updatedBooking as any).contractor?.id,
                        name: (updatedBooking as any).contractor?.name,
                    },
                },
                assignment: {
                    contractorId: result.contractorId,
                    score: result.score,
                },
            });
        } catch (error) {
            strapi.log.error('[Assignment] Error in assignToBooking:', error);
            return ctx.internalServerError('An error occurred during contractor assignment');
        }
    },

    /**
     * Get assignment details for a booking
     * GET /api/assignments/:bookingId
     */
    async getAssignment(ctx) {
        try {
            const { bookingId } = ctx.params;

            const booking: any = await strapi.entityService.findOne('api::booking.booking', bookingId, {
                populate: ['contractor', 'service'],
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            return ctx.send({
                bookingId: booking.id,
                confirmationCode: booking.confirmationCode,
                status: booking.status,
                contractor: booking.contractor?.id
                    ? {
                        id: booking.contractor.id,
                        name: booking.contractor.name,
                        email: booking.contractor.email,
                        phone: booking.contractor.phone,
                        rating: booking.contractor.averageRating,
                        completedJobs: booking.contractor.totalJobs,
                    }
                    : null,
                acceptedAt: booking.acceptedAt,
            });
        } catch (error) {
            strapi.log.error('[Assignment] Error in getAssignment:', error);
            return ctx.internalServerError('An error occurred while retrieving assignment');
        }
    },

    /**
     * Reassign booking to a different contractor
     * POST /api/assignments/reassign/:bookingId
     * Body: { contractorId?: number } (optional - if not provided, runs algorithm)
     */
    async reassignBooking(ctx) {
        try {
            const { bookingId } = ctx.params;
            const { contractorId } = ctx.request.body;

            const booking: any = await strapi.entityService.findOne('api::booking.booking', bookingId, {
                populate: ['service', 'contractor'],
            });

            if (!booking) {
                return ctx.notFound('Booking not found');
            }

            const previousContractorId = booking.contractor?.id;

            if (contractorId) {
                // Manual reassignment to specific contractor
                const contractor = await strapi.entityService.findOne(
                    'api::contractor.contractor',
                    contractorId
                );

                if (!contractor) {
                    return ctx.notFound('Contractor not found');
                }

                if (contractor.status !== 'active') {
                    return ctx.badRequest('Contractor is not active');
                }

                // Update booking
                await strapi.entityService.update('api::booking.booking', bookingId, {
                    data: {
                        contractor: contractorId,
                        status: 'confirmed',
                        acceptedAt: new Date(),
                    },
                });

                // Update availability
                if (previousContractorId) {
                    // TODO: Free up previous contractor's slot
                }

                await markSlotAsBooked(
                    strapi,
                    contractorId,
                    String(booking.scheduledDate || booking.date),
                    booking.timeWindow as any
                );

                return ctx.send({
                    success: true,
                    message: 'Booking reassigned successfully',
                    contractorId,
                });
            } else {
                // Automatic reassignment using algorithm
                // Temporarily remove current contractor from consideration
                // Then run assignment

                const serviceAddress: any = booking.serviceAddress || {};
                const result = await assignContractor(strapi, Number(bookingId), {
                    zipCode: String(booking.zipCode),
                    scheduledDate: String(booking.scheduledDate || booking.date),
                    timeWindow: booking.timeWindow as any,
                    serviceLatitude: serviceAddress.latitude,
                    serviceLongitude: serviceAddress.longitude,
                    serviceDuration: booking.service?.durationMinutes,
                });

                if (!result) {
                    return ctx.send({
                        success: false,
                        message: 'No alternative contractor found',
                    });
                }

                await strapi.entityService.update('api::booking.booking', bookingId, {
                    data: {
                        contractor: result.contractorId,
                        acceptedAt: new Date(),
                    },
                });

                // Update availability
                if (previousContractorId) {
                    // TODO: Free up previous contractor's slot
                }

                await markSlotAsBooked(
                    strapi,
                    result.contractorId,
                    String(booking.scheduledDate || booking.date),
                    booking.timeWindow as any
                );

                return ctx.send({
                    success: true,
                    message: 'Booking reassigned successfully',
                    contractorId: result.contractorId,
                    score: result.score,
                });
            }
        } catch (error) {
            strapi.log.error('[Assignment] Error in reassignBooking:', error);
            return ctx.internalServerError('An error occurred during reassignment');
        }
    },
}));
