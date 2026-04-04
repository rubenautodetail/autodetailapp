import {
    sendWelcomeEmail,
    sendBookingPendingEmail,
    sendBookingConfirmation,
    sendBookingCancelledEmail,
    sendJobAcceptedEmail,
    sendJobRejectedToAdmin,
    sendNewJobToContractor,
    sendContractorJobConfirmation,
    sendJobPendingApprovalEmail,
    sendJobApprovedReceiptEmail,
    sendContractorPaidEmail,
    sendJobStartedEmail,
    sendEnRouteEmail,
    sendReviewRequestEmail,
    BookingEmailData
} from './email';
import { createServiceClient } from './supabase/server';

type NotificationEvent =
    | { type: 'user.welcome'; user: { id?: string; name: string; email: string } }
    | { type: 'booking.created'; booking: any }
    | { type: 'booking.confirmed'; booking: any }
    | { type: 'booking.failed'; booking: any }
    | { type: 'booking.pending_approval'; booking: any }
    | { type: 'booking.approved'; booking: any; contractorEmail: string }
    | { type: 'contractor.job_assigned'; booking: any; contractorEmail: string }
    | { type: 'contractor.job_accepted'; booking: any; contractor: any; contractorEmail?: string }
    | { type: 'contractor.job_rejected'; booking: any }
    | { type: 'contractor.en_route'; booking: any }
    | { type: 'contractor.job_started'; booking: any }
    | { type: 'booking.review_request'; booking: any };

/**
 * Creates an in-app notification in Supabase database
 */
async function createInAppNotification(
    userId: string | undefined | null,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    link?: string
) {
    if (!userId) return; // Skip if no user ID provided

    try {
        const supabase = createServiceClient();
        await supabase.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type,
            link
        });
    } catch (e) {
        console.error('Failed to create in-app notification:', e);
    }
}

/**
 * Transforms a raw Supabase booking row + related data into the BookingEmailData shape
 */
function mapBookingData(rawBooking: any, contractor?: any): BookingEmailData {
    return {
        id: rawBooking.id,
        confirmationCode: rawBooking.confirmation_code,
        scheduledDate: rawBooking.date,
        scheduledTime: rawBooking.time_window,
        totalAmount: rawBooking.total_amount,
        paymentStatus: rawBooking.payment_status,
        customer: {
            firstName: rawBooking.customer_name?.split(' ')[0] || '',
            lastName: rawBooking.customer_name?.split(' ').slice(1).join(' ') || '',
            email: rawBooking.customer_email,
            phone: rawBooking.customer_phone,
        },
        service: {
            name: rawBooking.service_name || 'Detailing Service',
        },
        location: {
            address: rawBooking.address || '',
            city: rawBooking.city || '',
            state: rawBooking.state || '',
            zipCode: rawBooking.zip_code || '',
        },
        vehicle: {
            make: rawBooking.vehicle_make,
            model: rawBooking.vehicle_model,
            year: rawBooking.vehicle_year,
            color: rawBooking.vehicle_color,
        },
        paymentIntentId: rawBooking.payment_intent_id,
        locale: rawBooking.locale || 'en',
        contractor: contractor ? {
            firstName: contractor.full_name?.split(' ')[0] || contractor.firstName,
            lastName: contractor.full_name?.split(' ').slice(1).join(' ') || contractor.lastName,
        } : undefined
    };
}

/**
 * Global notification service
 * Orchestrates business events and dispatches emails (and later in-app alerts).
 */
export async function notify(event: NotificationEvent): Promise<void> {
    try {
        // Helper: resolve locale from booking or default to 'en'
        const loc = (b?: { locale?: string }): 'en' | 'es' =>
            (b?.locale === 'es' ? 'es' : 'en');

        switch (event.type) {
            case 'user.welcome':
                await sendWelcomeEmail(event.user);
                await createInAppNotification(
                    event.user.id,
                    'Welcome to DetailWash!',
                    'We are excited to have you on board. Book your first detail today.',
                    'info'
                );
                break;

            case 'booking.created':
                await sendBookingPendingEmail(mapBookingData(event.booking));
                break;

            case 'booking.confirmed': {
                const l = loc(event.booking);
                await sendBookingConfirmation(mapBookingData(event.booking));
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Reserva Confirmada' : 'Booking Confirmed',
                    l === 'es'
                        ? `Tu reserva para ${event.booking.service_name || 'Detallado'} ha sido confirmada.`
                        : `Your booking for ${event.booking.service_name || 'Detailing'} is confirmed!`,
                    'success',
                    `/${l}/booking/${event.booking.id}/track`
                );
                break;
            }

            case 'booking.failed': {
                const l = loc(event.booking);
                await sendBookingCancelledEmail(mapBookingData(event.booking));
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Pago Fallido' : 'Payment Failed',
                    l === 'es'
                        ? 'El pago de tu reserva no pudo ser procesado.'
                        : 'The payment for your booking failed to process.',
                    'error'
                );
                break;
            }

            case 'booking.pending_approval': {
                const l = loc(event.booking);
                await sendJobPendingApprovalEmail(mapBookingData(event.booking));
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Trabajo Completado - Aprobacion Necesaria' : 'Job Complete - Approval Needed',
                    l === 'es'
                        ? 'Tu detallado esta completo. Por favor aprueba el trabajo para que podamos procesar el pago.'
                        : 'Your detail is complete! Please approve the work so we can capture payment.',
                    'warning',
                    `/${l}/booking/${event.booking.id}/approve`
                );
                break;
            }

            case 'booking.approved': {
                const l = loc(event.booking);
                const approvedBooking = mapBookingData(event.booking);
                await sendJobApprovedReceiptEmail(approvedBooking);

                // Notify Customer
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Recibo' : 'Receipt',
                    l === 'es'
                        ? 'Gracias por tu preferencia. El pago ha sido procesado.'
                        : 'Thank you for your business! Payment has been captured.',
                    'success',
                    `/${l}/booking/${event.booking.id}/receipt`
                );

                // Notify Contractor (contractors use 'en' — internal-facing)
                await createInAppNotification(event.booking.contractor_id, 'Job Approved', 'The customer approved your job. Payment is being processed.', 'success');

                if (event.contractorEmail) {
                    await sendContractorPaidEmail(event.contractorEmail, approvedBooking);
                }
                break;
            }

            case 'contractor.job_assigned':
                // Email only — in-app notifications are batch-inserted by the caller
                // with the correct contractor user_id (booking.contractor_id is null at this stage)
                await sendNewJobToContractor(mapBookingData(event.booking), event.contractorEmail);
                break;

            case 'contractor.job_accepted': {
                const l = loc(event.booking);
                await sendJobAcceptedEmail(mapBookingData(event.booking, event.contractor));
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Contratista Acepto el Trabajo' : 'Contractor Accepted Job',
                    l === 'es'
                        ? `${event.contractor.full_name || 'Un contratista'} ha aceptado tu reserva y esta en camino.`
                        : `${event.contractor.full_name || 'A contractor'} has accepted your booking and is on their way.`,
                    'info',
                    `/${l}/booking/${event.booking.id}/track`
                );
                // Send full job details to the contractor who accepted
                if (event.contractorEmail) {
                    await sendContractorJobConfirmation(event.contractorEmail, mapBookingData(event.booking, event.contractor));
                }
                break;
            }

            case 'contractor.job_rejected':
                await sendJobRejectedToAdmin(mapBookingData(event.booking));
                break;

            case 'contractor.en_route': {
                const l = loc(event.booking);
                await sendEnRouteEmail(mapBookingData(event.booking));
                await createInAppNotification(
                    event.booking.user_id,
                    l === 'es' ? 'Detallador en Camino' : 'Detailer On The Way',
                    l === 'es'
                        ? 'Tu detallador va en camino. Llegara en breve.'
                        : 'Your detailer is heading to you now! They should arrive shortly.',
                    'info',
                    `/${l}/booking/${event.booking.id}/track`
                );
                break;
            }

            case 'contractor.job_started':
                await sendJobStartedEmail(mapBookingData(event.booking));
                break;

            case 'booking.review_request':
                await sendReviewRequestEmail(mapBookingData(event.booking));
                break;

            default:
                console.warn(`Unhandled notification event type`);
        }
    } catch (error) {
        console.error(`Error processing notification [${event.type}]:`, error);
        // Don't throw — we usually don't want a notification failure to break the main transaction flow
    }
}
