import {
    sendWelcomeEmail,
    sendBookingPendingEmail,
    sendBookingConfirmation,
    sendBookingCancelledEmail,
    sendJobAcceptedEmail,
    sendJobRejectedToAdmin,
    sendNewJobToContractor,
    sendJobPendingApprovalEmail,
    sendJobApprovedReceiptEmail,
    sendContractorPaidEmail,
    sendJobStartedEmail,
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
    | { type: 'contractor.job_accepted'; booking: any; contractor: any }
    | { type: 'contractor.job_rejected'; booking: any }
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
        switch (event.type) {
            case 'user.welcome':
                await sendWelcomeEmail(event.user);
                await createInAppNotification(event.user.id, 'Welcome to DetailWash!', 'We are excited to have you on board. Book your first detail today.', 'info');
                break;

            case 'booking.created':
                await sendBookingPendingEmail(mapBookingData(event.booking));
                break;

            case 'booking.confirmed':
                await sendBookingConfirmation(mapBookingData(event.booking));
                await createInAppNotification(event.booking.user_id, 'Booking Confirmed', `Your booking for ${event.booking.service_name || 'Detailing'} is confirmed!`, 'success', `/${event.booking.locale || 'en'}/booking/${event.booking.id}`);
                break;

            case 'booking.failed':
                await sendBookingCancelledEmail(mapBookingData(event.booking));
                await createInAppNotification(event.booking.user_id, 'Payment Failed', `The payment for your booking failed to process.`, 'error');
                break;

            case 'booking.pending_approval':
                await sendJobPendingApprovalEmail(mapBookingData(event.booking));
                await createInAppNotification(event.booking.user_id, 'Job Complete - Approval Needed', `Your detail is complete! Please approve the work so we can capture payment.`, 'warning', `/${event.booking.locale || 'en'}/booking/${event.booking.id}/approve`);
                break;

            case 'booking.approved':
                const approvedBooking = mapBookingData(event.booking);
                await sendJobApprovedReceiptEmail(approvedBooking);

                // Notify Customer
                await createInAppNotification(event.booking.user_id, 'Receipt', `Thank you for your business! Payment has been captured.`, 'success', `/${event.booking.locale || 'en'}/booking/${event.booking.id}`);

                // Notify Contractor
                await createInAppNotification(event.booking.contractor_id, 'Job Approved', `The customer approved your job. Payment is being processed.`, 'success');

                if (event.contractorEmail) {
                    await sendContractorPaidEmail(event.contractorEmail, approvedBooking);
                }
                break;

            case 'contractor.job_assigned':
                await sendNewJobToContractor(mapBookingData(event.booking), event.contractorEmail);
                await createInAppNotification(event.booking.contractor_id, 'New Job Assigned', `You have been assigned a new job matching your preferences.`, 'info');
                break;

            case 'contractor.job_accepted':
                await sendJobAcceptedEmail(mapBookingData(event.booking, event.contractor));
                await createInAppNotification(event.booking.user_id, 'Contractor Accepted Job', `${event.contractor.full_name || 'A contractor'} has accepted your booking and is on their way.`, 'info', `/${event.booking.locale || 'en'}/booking/${event.booking.id}`);
                break;

            case 'contractor.job_rejected':
                await sendJobRejectedToAdmin(mapBookingData(event.booking));
                break;

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
