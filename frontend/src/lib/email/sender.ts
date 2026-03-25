/**
 * lib/email/sender.ts
 * Single Resend initialisation + typed sendEmail dispatcher.
 * All email functions in lib/email.ts delegate here.
 */

import { Resend } from 'resend';
import {
  bookingConfirmationTemplate,
  newJobContractorTemplate,
  paymentReceiptTemplate,
  contractorApplicationAdminTemplate,
  contractorApplicationReceivedTemplate,
  welcomeEmailTemplate,
  bookingPendingTemplate,
  jobAcceptedTemplate,
  contractorJobConfirmationTemplate,
  jobRejectedAdminTemplate,
  bookingCancelledTemplate,
  jobPendingApprovalTemplate,
  approvalReminderTemplate,
  chargebackAlertTemplate,
  jobStartedTemplate,
  enRouteTemplate,
  reviewRequestTemplate,
  contractorApprovedTemplate,
  contractorRejectedTemplate,
  contractorPaidTemplate,
  paymentReminderTemplate,
  payoutConfirmationTemplate,
  type BookingEmailData,
  type ApprovalReminderData,
  type PayoutEmailData,
  type ContractorApplicationData,
} from './templates';

// ── Resend singleton ─────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Emails cannot be sent.');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@dtailwash.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dtailwash.com';

// ── Email type discriminated union ───────────────────────────────────────────

export type EmailPayload =
  | { type: 'booking_confirmation';                to: string; data: BookingEmailData }
  | { type: 'new_job_contractor';                  to: string; data: BookingEmailData }
  | { type: 'payment_receipt';                     to: string; data: BookingEmailData }
  | { type: 'contractor_application_admin';        to: string; data: ContractorApplicationData }
  | { type: 'contractor_application_received';     to: string; data: ContractorApplicationData }
  | { type: 'welcome';                             to: string; data: { name: string; email: string } }
  | { type: 'booking_pending';                     to: string; data: BookingEmailData }
  | { type: 'job_accepted';                        to: string; data: BookingEmailData }
  | { type: 'contractor_job_confirmation';         to: string; data: BookingEmailData }
  | { type: 'job_rejected_admin';                  to: string; data: BookingEmailData }
  | { type: 'booking_cancelled';                   to: string; data: BookingEmailData }
  | { type: 'job_pending_approval';                to: string; data: BookingEmailData }
  | { type: 'approval_reminder';                   to: string; data: ApprovalReminderData; minutesRemaining: number }
  | { type: 'chargeback_alert';                    to: string; data: { bookingId: string | number; disputeId: string; paymentIntentId: string; amount: number; reason: string } }
  | { type: 'job_started';                         to: string; data: BookingEmailData }
  | { type: 'en_route';                            to: string; data: BookingEmailData }
  | { type: 'review_request';                      to: string; data: BookingEmailData }
  | { type: 'contractor_approved';                 to: string; data: { fullName: string; email: string; locale?: string } }
  | { type: 'contractor_rejected';                 to: string; data: { fullName: string; email: string; locale?: string } }
  | { type: 'contractor_paid';                     to: string; data: BookingEmailData }
  | { type: 'payment_reminder';                    to: string; data: BookingEmailData; reminderNumber: 1 | 2 | 3 }
  | { type: 'payout_confirmation';                 to: string; data: PayoutEmailData };

// ── Subject registry ─────────────────────────────────────────────────────────

function resolveSubject(payload: EmailPayload): string {
  switch (payload.type) {
    case 'booking_confirmation':
      return 'Your Detailing Appointment is Confirmed! 🚗';
    case 'new_job_contractor':
      return '🔔 New Job Available — Log in to Accept';
    case 'payment_receipt':
      return `Receipt for Your Detailing Service - $${(payload.data as BookingEmailData).totalAmount.toFixed(2)}`;
    case 'contractor_application_admin':
      return `New Contractor Application: ${(payload.data as ContractorApplicationData).fullName}`;
    case 'contractor_application_received':
      return 'Application Received — DTailWash';
    case 'welcome':
      return 'Welcome to DTailWash! 🚗';
    case 'booking_pending':
      return 'Booking Received - Pending Payment';
    case 'job_accepted':
      return 'Your Detailer is Assigned!';
    case 'contractor_job_confirmation':
      return `✅ Job Confirmed — ${(payload.data as BookingEmailData).confirmationCode}`;
    case 'job_rejected_admin':
      return `Alert: Job Rejected - ${(payload.data as BookingEmailData).confirmationCode}`;
    case 'booking_cancelled':
      return 'Booking Cancelled';
    case 'job_pending_approval':
      return 'Action Required: Your Car is Ready for Inspection! ✨';
    case 'approval_reminder': {
      const isUrgent = payload.minutesRemaining <= 2;
      return isUrgent
        ? `⏰ Final Reminder: Auto-approval in ${payload.minutesRemaining} min — ${payload.data.service.name}`
        : `⏳ Reminder: ${payload.minutesRemaining} min left to approve your detail`;
    }
    case 'chargeback_alert':
      return `⚠️ Chargeback Alert — Booking ${payload.data.bookingId} ($${(payload.data.amount / 100).toFixed(2)})`;
    case 'job_started':
      return 'Your Detailer Has Started Work! 🚿';
    case 'en_route':
      return 'Your Detailer Is On The Way! 🚗';
    case 'review_request':
      return 'How Was Your Detail? Leave a Review ⭐';
    case 'contractor_approved': {
      const isEs = payload.data.locale === 'es';
      return isEs ? '¡Aprobado! Bienvenido a DTailWash 🎉' : "You're Approved! Welcome to DTailWash 🎉";
    }
    case 'contractor_rejected': {
      const isEs = payload.data.locale === 'es';
      return isEs ? 'Actualización de tu solicitud — DTailWash' : 'Application Update — DTailWash';
    }
    case 'contractor_paid':
      return `Job Approved! Booking ${(payload.data as BookingEmailData).confirmationCode} 💰`;
    case 'payment_reminder': {
      const subjects: Record<1 | 2 | 3, string> = {
        1: `Complete your booking — ${(payload.data as BookingEmailData).service.name}`,
        2: `Reminder: Payment needed for your ${(payload.data as BookingEmailData).service.name}`,
        3: 'Final reminder — your booking will be released',
      };
      return subjects[payload.reminderNumber];
    }
    case 'payout_confirmation': {
      const isEs = (payload.data as PayoutEmailData).locale === 'es';
      const pd = payload.data as PayoutEmailData;
      const fmt = (d: string) =>
        new Date(d + 'T12:00:00Z').toLocaleDateString(isEs ? 'es-US' : 'en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        });
      return isEs
        ? `Pago enviado: semana del ${fmt(pd.periodStart)}`
        : `Payment sent: week of ${fmt(pd.periodStart)}`;
    }
  }
}

// ── HTML renderer ─────────────────────────────────────────────────────────────

function resolveHtml(payload: EmailPayload): string {
  switch (payload.type) {
    case 'booking_confirmation':          return bookingConfirmationTemplate(payload.data);
    case 'new_job_contractor':            return newJobContractorTemplate(payload.data);
    case 'payment_receipt':               return paymentReceiptTemplate(payload.data);
    case 'contractor_application_admin':  return contractorApplicationAdminTemplate(payload.data);
    case 'contractor_application_received': return contractorApplicationReceivedTemplate(payload.data);
    case 'welcome':                       return welcomeEmailTemplate(payload.data);
    case 'booking_pending':               return bookingPendingTemplate(payload.data);
    case 'job_accepted':                  return jobAcceptedTemplate(payload.data);
    case 'contractor_job_confirmation':   return contractorJobConfirmationTemplate(payload.data);
    case 'job_rejected_admin':            return jobRejectedAdminTemplate(payload.data);
    case 'booking_cancelled':             return bookingCancelledTemplate(payload.data);
    case 'job_pending_approval':          return jobPendingApprovalTemplate(payload.data);
    case 'approval_reminder':             return approvalReminderTemplate(payload.data, payload.minutesRemaining);
    case 'chargeback_alert':              return chargebackAlertTemplate(payload.data);
    case 'job_started':                   return jobStartedTemplate(payload.data);
    case 'en_route':                      return enRouteTemplate(payload.data);
    case 'review_request':                return reviewRequestTemplate(payload.data);
    case 'contractor_approved':           return contractorApprovedTemplate(payload.data);
    case 'contractor_rejected':           return contractorRejectedTemplate(payload.data);
    case 'contractor_paid':               return contractorPaidTemplate(payload.data);
    case 'payment_reminder':              return paymentReminderTemplate(payload.data, payload.reminderNumber);
    case 'payout_confirmation':           return payoutConfirmationTemplate(payload.data);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a typed email via Resend with a single try/catch.
 * Pass `to` as the recipient; for admin-targeted emails (chargeback, job_rejected_admin,
 * contractor_application_admin) the caller should pass SUPPORT_EMAIL.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const subject = resolveSubject(payload);
  const html    = resolveHtml(payload);

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Error sending "${payload.type}" to ${payload.to}:`, error);
      throw error;
    }

    console.log(`[email] Sent "${payload.type}" to ${payload.to}`);
  } catch (err) {
    console.error(`[email] Failed to send "${payload.type}" to ${payload.to}:`, err);
    throw err;
  }
}

// Re-export types so callers can import from this module if needed
export type {
  BookingEmailData,
  ApprovalReminderData,
  PayoutEmailData,
  ContractorApplicationData,
};

export { SUPPORT_EMAIL };
