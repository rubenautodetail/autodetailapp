/**
 * lib/email.ts
 * Public API — thin wrappers around lib/email/sender.ts.
 * All exported function names are preserved so callers require no changes.
 */

export type { BookingEmailData, ApprovalReminderData, PayoutEmailData } from './email/templates';
export { sendEmail } from './email/sender';
import { sendEmail } from './email/sender';
import { SUPPORT_EMAIL } from './email/sender';
import type {
  BookingEmailData,
  ApprovalReminderData,
  PayoutEmailData,
  ContractorApplicationData,
} from './email/templates';

// ── Customer booking emails ───────────────────────────────────────────────────

export async function sendBookingConfirmation(booking: BookingEmailData) {
  return sendEmail({ type: 'booking_confirmation', to: booking.customer.email, data: booking });
}

export async function sendBookingPendingEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'booking_pending', to: booking.customer.email, data: booking });
}

export async function sendBookingCancelledEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'booking_cancelled', to: booking.customer.email, data: booking });
}

export async function sendJobAcceptedEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'job_accepted', to: booking.customer.email, data: booking });
}

export async function sendJobPendingApprovalEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'job_pending_approval', to: booking.customer.email, data: booking });
}

export async function sendJobApprovedReceiptEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'payment_receipt', to: booking.customer.email, data: booking });
}

export async function sendJobStartedEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'job_started', to: booking.customer.email, data: booking });
}

export async function sendEnRouteEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'en_route', to: booking.customer.email, data: booking });
}

export async function sendReviewRequestEmail(booking: BookingEmailData) {
  return sendEmail({ type: 'review_request', to: booking.customer.email, data: booking });
}

export async function sendPaymentReceipt(booking: BookingEmailData) {
  return sendEmail({ type: 'payment_receipt', to: booking.customer.email, data: booking });
}

export async function sendPaymentReminderEmail(
  booking: BookingEmailData,
  reminderNumber: 1 | 2 | 3,
) {
  return sendEmail({ type: 'payment_reminder', to: booking.customer.email, data: booking, reminderNumber });
}

export async function sendApprovalReminderEmail(
  booking: ApprovalReminderData,
  minutesRemaining: number,
) {
  return sendEmail({ type: 'approval_reminder', to: booking.customer.email, data: booking, minutesRemaining });
}

// ── Contractor emails ─────────────────────────────────────────────────────────

export async function sendNewJobToContractor(
  booking: BookingEmailData,
  contractorEmail: string,
) {
  return sendEmail({ type: 'new_job_contractor', to: contractorEmail, data: booking });
}

export async function sendContractorJobConfirmation(
  contractorEmail: string,
  booking: BookingEmailData,
) {
  return sendEmail({ type: 'contractor_job_confirmation', to: contractorEmail, data: booking });
}

export async function sendContractorPaidEmail(
  contractorEmail: string,
  booking: BookingEmailData,
) {
  return sendEmail({ type: 'contractor_paid', to: contractorEmail, data: booking });
}

export async function sendContractorApprovedEmail(contractor: {
  fullName: string;
  email: string;
  locale?: string;
}) {
  return sendEmail({ type: 'contractor_approved', to: contractor.email, data: contractor });
}

export async function sendContractorRejectedEmail(contractor: {
  fullName: string;
  email: string;
  locale?: string;
}) {
  return sendEmail({ type: 'contractor_rejected', to: contractor.email, data: contractor });
}

export async function sendPayoutConfirmation(data: PayoutEmailData) {
  return sendEmail({ type: 'payout_confirmation', to: data.contractorEmail, data });
}

// ── Application emails ────────────────────────────────────────────────────────

export async function sendContractorApplication(applicationData: ContractorApplicationData) {
  return sendEmail({ type: 'contractor_application_admin', to: SUPPORT_EMAIL, data: applicationData });
}

export async function sendContractorApplicationReceived(applicationData: ContractorApplicationData) {
  return sendEmail({ type: 'contractor_application_received', to: applicationData.email, data: applicationData });
}

// ── User emails ───────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  return sendEmail({ type: 'welcome', to: user.email, data: user });
}

// ── Admin alert emails ────────────────────────────────────────────────────────

export async function sendJobRejectedToAdmin(booking: BookingEmailData) {
  return sendEmail({ type: 'job_rejected_admin', to: SUPPORT_EMAIL, data: booking });
}

export async function sendChargebackAlertEmail(data: {
  bookingId: string | number;
  disputeId: string;
  paymentIntentId: string;
  amount: number;
  reason: string;
}) {
  return sendEmail({ type: 'chargeback_alert', to: SUPPORT_EMAIL, data });
}
