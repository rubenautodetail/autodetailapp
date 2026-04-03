/**
 * lib/email/templates.ts
 * Typed HTML template functions for every email type sent by DTailWash.
 * Each function returns a plain HTML string ready to pass to Resend.
 */

// ── Shared config (read at module init; safe because this runs server-side) ──
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dtailwash.com';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '(305) 000-0000';
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

// ── Shared base layout ────────────────────────────────────────────────────────

/**
 * Wraps content in a consistent DTailWash shell (base styles + footer).
 * headerGradient / headerText are customised per email type.
 */
function baseLayout(opts: {
  headerGradient: string;
  headerText: string;
  body: string;
  footerLine?: string;
}): string {
  const footer = opts.footerLine ?? 'DTailWash';
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}
      .hd{background:${opts.headerGradient};color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center;}
      .hd h1{margin:0;font-size:24px;}
      .bd{background:#ffffff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;}
      .ft{text-align:center;color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;}
      .detail-box{background:#f9fafb;border-left:4px solid #667eea;padding:20px;margin:20px 0;border-radius:4px;}
      .detail-row{display:flex;justify-content:space-between;margin:10px 0;}
      .lbl{font-weight:600;color:#6b7280;}
      .val{color:#111827;}
      .btn{display:inline-block;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:600;margin:20px 0;}
      .highlight{background:#fef3c7;padding:2px 6px;border-radius:3px;}
    </style>
  </head>
  <body>
    <div class="hd"><h1>${opts.headerText}</h1></div>
    <div class="bd">${opts.body}</div>
    <div class="ft">
      <p>${footer}</p>
      <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </div>
  </body>
</html>`;
}

function fmtDate(date: string, locale = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  });
}

// ── Data types (re-exported for use in sender.ts) ─────────────────────────────

export interface BookingEmailData {
  id: number | string;
  confirmationCode: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  paymentStatus: string;
  completedAt?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  service: { name: string };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    color?: string;
  };
  contractor?: {
    firstName: string;
    lastName: string;
    rating?: number;
    completedJobs?: number;
    profilePhoto?: unknown;
  };
  beforePhotos?: unknown[];
  afterPhotos?: unknown[];
  notes?: string;
  paymentIntentId?: string;
  locale?: 'en' | 'es';
}

export interface ApprovalReminderData {
  id: number | string;
  confirmationCode: string;
  service: { name: string };
  customer: { email: string; firstName: string };
}

export interface PayoutEmailData {
  contractorName: string;
  contractorEmail: string;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  grossAmount: number;
  platformFee: number;
  contractorAmount: number;
  paymentMethod: 'ach' | 'zelle' | 'check' | 'cash';
  notes: string | null;
  locale?: 'en' | 'es';
}

export interface ContractorApplicationData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  serviceZipCodes: string[];
  documentsCount: number;
}

// ── Template functions ────────────────────────────────────────────────────────

export function bookingConfirmationTemplate(booking: BookingEmailData): string {
  const { customer, service, location } = booking;
  const vehicleRow =
    booking.vehicle && (booking.vehicle.make || booking.vehicle.model)
      ? `<div class="detail-row"><span class="lbl">Vehicle:</span><span class="val">${booking.vehicle.year ?? ''} ${booking.vehicle.make ?? ''} ${booking.vehicle.model ?? ''} - ${booking.vehicle.color ?? ''}</span></div>`
      : '';

  const body = `
    <p>Hi ${customer.firstName},</p>
    <p>Great news! Your detailing appointment has been confirmed. We can't wait to make your vehicle shine!</p>
    <div class="detail-box">
      <h3 style="margin-top:0;color:#667eea;">Booking Details</h3>
      <div class="detail-row"><span class="lbl">Confirmation Code:</span><span class="val"><strong>${booking.confirmationCode}</strong></span></div>
      <div class="detail-row"><span class="lbl">Service:</span><span class="val">${service.name}</span></div>
      <div class="detail-row"><span class="lbl">Date:</span><span class="val">${fmtDate(booking.scheduledDate)}</span></div>
      <div class="detail-row"><span class="lbl">Time:</span><span class="val">${booking.scheduledTime}</span></div>
      <div class="detail-row"><span class="lbl">Location:</span><span class="val">${location.address}, ${location.city}, ${location.state} ${location.zipCode}</span></div>
      ${vehicleRow}
      <div class="detail-row"><span class="lbl">Total Amount:</span><span class="val"><strong>$${booking.totalAmount.toFixed(2)}</strong></span></div>
      <div class="detail-row"><span class="lbl">Payment Status:</span><span class="val"><span class="highlight">Authorized (charged when service complete)</span></span></div>
    </div>
    <h3>What's Next?</h3>
    <ul>
      <li>We're assigning a professional detailer to your appointment</li>
      <li>You'll receive an introduction email within 30 minutes</li>
      <li>Your detailer will arrive at the scheduled time</li>
    </ul>
    <p style="margin-top:30px;"><a href="${APP_URL}/en/booking/${booking.id}/track" class="btn" style="background:#667eea;color:white;">View Booking Details</a></p>
    <p style="color:#6b7280;font-size:14px;margin-top:30px;">Need to make changes? Reply to this email or call us at ${SUPPORT_PHONE}</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    headerText: '🚗 Booking Confirmed!',
    body,
    footerLine: 'Thank you for choosing DTailWash',
  });
}

export function newJobContractorTemplate(booking: BookingEmailData): string {
  const { service, location } = booking;
  const body = `
    <p><strong>A new detailing job is available in your area. Log in to accept it before someone else does!</strong></p>
    <div style="background:#f0fdf4;border:2px solid #10b981;padding:20px;margin:20px 0;border-radius:8px;">
      <h3 style="margin-top:0;color:#065f46;">Job Overview</h3>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span class="lbl" style="color:#065f46;">Service:</span><span class="val">${service.name}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span class="lbl" style="color:#065f46;">Date:</span><span class="val">${fmtDate(booking.scheduledDate)}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span class="lbl" style="color:#065f46;">Time:</span><span class="val">${booking.scheduledTime}</span></div>
      <div class="detail-row" style="padding:8px 0;"><span class="lbl" style="color:#065f46;">Area:</span><span class="val">ZIP ${location.zipCode}</span></div>
    </div>
    <p>Log in to your contractor dashboard to view the full details and accept this job. First come, first served!</p>
    <p style="margin-top:30px;text-align:center;"><a href="${APP_URL}/en/contractor/dashboard" class="btn" style="background:#10b981;color:white;">Go to My Dashboard</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    headerText: '🔔 New Job Available!',
    body,
    footerLine: 'DTailWash - Contractor Portal',
  });
}

export function paymentReceiptTemplate(booking: BookingEmailData): string {
  const { customer, service, contractor } = booking;
  const contractorName = contractor ? `${contractor.firstName} ${contractor.lastName}` : 'Your Detailer';

  const body = `
    <p>Hi ${customer.firstName},</p>
    <p>Thank you for choosing DTailWash! Here's your receipt for the service.</p>
    <div style="background:#f9fafb;border:2px solid #3b82f6;padding:20px;margin:20px 0;border-radius:8px;">
      <h3 style="margin-top:0;color:#1e40af;">Receipt #${booking.confirmationCode}</h3>
      <p style="color:#6b7280;font-size:14px;">Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
      <p style="color:#6b7280;font-size:14px;">Service Provider: ${contractorName}</p>
      <div style="margin-top:20px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;"><span>${service.name}</span><span>$${booking.totalAmount.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:15px 0;font-size:18px;font-weight:bold;color:#1e40af;border-top:2px solid #3b82f6;margin-top:10px;"><span>Total Charged</span><span>$${booking.totalAmount.toFixed(2)}</span></div>
      </div>
      ${booking.paymentIntentId ? `<p style="color:#6b7280;font-size:12px;margin-top:15px;">Transaction ID: ${booking.paymentIntentId}</p>` : ''}
    </div>
    <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;">
      <h3 style="margin:0 0 10px 0;color:#1e40af;">Love your results? 🌟</h3>
      <p style="margin:0;"><a href="${APP_URL}/en/booking/${booking.id}/review" class="btn" style="background:#3b82f6;color:white;">⭐ Rate Your Service</a></p>
    </div>
    <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;">
      <h3 style="margin:0 0 10px 0;color:#1e40af;">Book Again &amp; Save!</h3>
      <p style="margin:0;">Use code <strong>LOYAL10</strong> for 10% off your next service.</p>
      <p style="margin:10px 0 0 0;"><a href="${APP_URL}/en/booking/select" class="btn" style="background:#3b82f6;color:white;">Schedule Another Appointment</a></p>
    </div>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)',
    headerText: '💳 Payment Receipt',
    body,
    footerLine: 'Thank you for your business!',
  });
}

export function contractorApplicationAdminTemplate(data: ContractorApplicationData): string {
  const body = `
    <p>A new contractor has applied to join the network.</p>
    <div style="background:#f3f4f6;border:1px solid #d1d5db;padding:20px;margin:20px 0;border-radius:8px;">
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Name:</span> ${data.fullName}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Email:</span> ${data.email}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Phone:</span> ${data.phone}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Address:</span> ${data.address}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Business Name:</span> ${data.businessName || 'N/A'}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Service ZIP Codes:</span> ${data.serviceZipCodes.join(', ')}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Attached Documents:</span> ${data.documentsCount} uploaded</div>
    </div>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#4f46e5 0%,#4338ca 100%)',
    headerText: 'New Contractor Application',
    body,
  });
}

export function contractorApplicationReceivedTemplate(data: ContractorApplicationData): string {
  const body = `
    <p>Hi ${data.fullName},</p>
    <p>Thank you for applying to join the <strong>DTailWash</strong> contractor network!</p>
    <p>We've received your application and our team will review it within <strong>1–2 business days</strong>.</p>
    <div style="background:#f9fafb;border-left:4px solid #D0B078;padding:20px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;color:#4b5563;">What happens next?</p>
      <ul style="margin:10px 0 0 0;padding-left:20px;color:#4b5563;">
        <li>Our team reviews your documents and information</li>
        <li>You'll receive an approval or follow-up email within 1–2 business days</li>
        <li>Once approved, you can set up your payments and start accepting jobs</li>
      </ul>
    </div>
    <p>In the meantime, you can log in to check your application status at <a href="${APP_URL}/en/contractor/pending">${APP_URL}</a>.</p>
    <p>Questions? Reply to this email or contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    <p>Thanks for joining us!<br/>The DTailWash Team</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#131835 0%,#1e2a50 100%)',
    headerText: 'Application Received! 🎉',
    body,
    footerLine: 'DTailWash — Contractor Network',
  });
}

export function welcomeEmailTemplate(user: { name: string }): string {
  const body = `
    <p>Hi ${user.name},</p>
    <p>We're thrilled to have you here!</p>
    <p>First, please confirm your email using the separate confirmation email we just sent you. Once confirmed, you can log in and start booking premium auto detailing services.</p>
    <p style="text-align:center;"><a href="${APP_URL}/en/login" class="btn" style="background:#2563eb;color:white;">Sign in to your account</a></p>
    <p>If you have any questions, just reply to this email.</p>
    <p>Happy detailing!<br/>The DTailWash Team</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#2563eb 0%,#1e40af 100%)',
    headerText: 'Welcome to DTailWash! 🚗',
    body,
  });
}

export function bookingPendingTemplate(booking: BookingEmailData): string {
  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>We've received your booking request for a <strong>${booking.service.name}</strong>.</p>
    <p>Your booking is currently marked as <strong>Pending</strong> while we process the payment authorization. Once the payment hold is successful, you will receive a confirmation email with all the details and we will assign a detailer to your job.</p>
    <p>Thank you for choosing DTailWash!</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
    headerText: 'Booking Received',
    body,
  });
}

export function jobAcceptedTemplate(booking: BookingEmailData): string {
  const contractorName = booking.contractor
    ? `${booking.contractor.firstName} ${booking.contractor.lastName}`
    : 'A detailer';

  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>Great news! <strong>${contractorName}</strong> has been assigned to your booking (${booking.confirmationCode}) and will be arriving at the scheduled time.</p>
    <p>If you need to contact your detailer before they arrive or make any changes to your appointment, please visit your dashboard.</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    headerText: 'Detailer Assigned! ✨',
    body,
  });
}

export function contractorJobConfirmationTemplate(booking: BookingEmailData): string {
  const { service, location, customer } = booking;
  const body = `
    <p><strong>You have successfully accepted this job. Here are the full details:</strong></p>
    <div style="background:#f0fdf4;border:2px solid #10b981;padding:20px;margin:20px 0;border-radius:8px;">
      <h3 style="margin-top:0;color:#065f46;">Job Details</h3>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Confirmation Code:</span><span><strong>${booking.confirmationCode}</strong></span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Service:</span><span>${service.name}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Date:</span><span>${fmtDate(booking.scheduledDate)}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Time:</span><span>${booking.scheduledTime}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Location:</span><span>${location.address}, ${location.city}, ${location.state} ${location.zipCode}</span></div>
      <div class="detail-row" style="border-bottom:1px solid #d1fae5;padding:8px 0;"><span style="font-weight:600;color:#065f46;">Customer:</span><span>${customer.firstName} ${customer.lastName}</span></div>
      <div class="detail-row" style="padding:8px 0;"><span style="font-weight:600;color:#065f46;">Contact:</span><span>${customer.phone}</span></div>
    </div>
    <h3>Next Steps:</h3>
    <ul>
      <li>Prepare your equipment and supplies</li>
      <li>Arrive on time and provide excellent service!</li>
    </ul>
    <p style="margin-top:30px;text-align:center;"><a href="${APP_URL}/en/contractor/jobs/${booking.id}" class="btn" style="background:#10b981;color:white;">View Job in Dashboard</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    headerText: '✅ Job Confirmed!',
    body,
    footerLine: 'DTailWash - Contractor Portal',
  });
}

export function jobRejectedAdminTemplate(booking: BookingEmailData): string {
  const body = `
    <p>A contractor has rejected an assigned job. Reassignment may be required.</p>
    <p><strong>Booking Code:</strong> ${booking.confirmationCode}</p>
    <p><strong>Customer:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
    <p><strong>Scheduled:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()} at ${booking.scheduledTime}</p>
    <p style="text-align:center;"><a href="${APP_URL}/en/admin/bookings" class="btn" style="background:#dc2626;color:white;">View Admin Dashboard</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
    headerText: 'Alert: Job Rejected ⚠️',
    body,
  });
}

export function bookingCancelledTemplate(booking: BookingEmailData): string {
  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>Your booking <strong>${booking.confirmationCode}</strong> has been cancelled.</p>
    <p>If this was due to a payment failure, your card has not been charged.</p>
    <p>If you'd like to reschedule, please visit our website to place a new booking.</p>
    <p>Thank you,<br/>DTailWash Team</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
    headerText: 'Booking Cancelled',
    body,
  });
}

export function jobPendingApprovalTemplate(booking: BookingEmailData): string {
  const body = `
    <p style="font-size:16px;">Hi ${booking.customer.firstName},</p>
    <p style="font-size:16px;">Your detailer has just finished the <strong>${booking.service.name}</strong> service!</p>
    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb;">
      <h3 style="margin-top:0;color:#4b5563;">Next Steps:</h3>
      <ol style="margin-bottom:0;">
        <li>Please walk out to your vehicle and inspect the work with your detailer.</li>
        <li>Make sure everything is to your satisfaction.</li>
        <li>Click the button below to approve the job and release the final payment.</li>
      </ol>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/en/booking/${booking.id}/approve?code=${booking.confirmationCode}" class="btn" style="background:#8b5cf6;color:white;padding:15px 40px;font-size:16px;font-weight:700;">INSPECT &amp; APPROVE JOB</a>
    </div>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)',
    headerText: 'Your Car is Ready! 🚘✨',
    body,
  });
}

export function approvalReminderTemplate(
  booking: ApprovalReminderData,
  minutesRemaining: number,
): string {
  const isUrgent = minutesRemaining <= 2;
  const headerGradient = isUrgent
    ? 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)'
    : 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)';
  const urgencyLine = isUrgent
    ? `<p style="font-size:15px;font-weight:700;color:#ef4444;">⏰ Auto-approval in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}!</p>`
    : `<p style="font-size:15px;font-weight:600;color:#b45309;">⏳ ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} left to inspect your vehicle.</p>`;

  const body = `
    <p style="font-size:16px;">Hi ${booking.customer.firstName},</p>
    <p style="font-size:16px;">Your <strong>${booking.service.name}</strong> is complete and waiting for your inspection.</p>
    ${urgencyLine}
    <p style="font-size:14px;color:#6b7280;">If we don't hear from you, the job will be automatically approved.</p>
    <div style="text-align:center;">
      <a href="${APP_URL}/en/booking/${booking.id}/approve?code=${booking.confirmationCode}" class="btn" style="background:#8b5cf6;color:white;padding:15px 40px;font-size:16px;font-weight:700;">INSPECT &amp; APPROVE NOW</a>
    </div>`;

  return baseLayout({
    headerGradient,
    headerText: 'Reminder: Your Car is Ready! 🚘',
    body,
  });
}

export function chargebackAlertTemplate(data: {
  bookingId: string | number;
  disputeId: string;
  paymentIntentId: string;
  amount: number;
  reason: string;
}): string {
  const amountFormatted = (data.amount / 100).toFixed(2);
  const body = `
    <p><strong>A customer has opened a chargeback dispute. Immediate action required.</strong></p>
    <div style="background:#fef2f2;border:2px solid #dc2626;padding:20px;border-radius:8px;margin:20px 0;">
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Booking ID:</span> ${data.bookingId}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Dispute ID:</span> ${data.disputeId}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Payment Intent:</span> ${data.paymentIntentId}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Disputed Amount:</span> $${amountFormatted}</div>
      <div style="margin:10px 0;"><span style="font-weight:600;color:#4b5563;">Reason:</span> ${data.reason}</div>
    </div>
    <p>Log into the Stripe Dashboard to respond to this dispute. You typically have <strong>7–21 days</strong> to submit evidence.</p>
    <p style="text-align:center;"><a href="${APP_URL}/en/admin/bookings/${data.bookingId}" class="btn" style="background:#dc2626;color:white;">View Booking in Admin</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)',
    headerText: '⚠️ Chargeback Alert',
    body,
  });
}

export function jobStartedTemplate(booking: BookingEmailData): string {
  const locale = booking.locale || 'en';
  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>Your detailer has arrived and started working on your vehicle. They'll update you when they're finished.</p>
    <div style="background:#fff7ed;border-left:4px solid #f97316;padding:20px;margin:20px 0;border-radius:4px;">
      <h3 style="margin-top:0;color:#ea580c;">Service in Progress</h3>
      <p><strong>Booking:</strong> ${booking.confirmationCode}</p>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Date:</strong> ${fmtDate(booking.scheduledDate)}</p>
      <p><strong>Time:</strong> ${booking.scheduledTime}</p>
    </div>
    <p style="margin-top:30px;"><a href="${APP_URL}/${locale}/booking/${booking.id}/track" class="btn" style="background:#f97316;color:white;">View Booking Details</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)',
    headerText: 'Detailer Has Started Work! 🚿',
    body,
    footerLine: 'Thank you for choosing DTailWash',
  });
}

export function enRouteTemplate(booking: BookingEmailData): string {
  const locale = booking.locale || 'en';
  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>Great news! Your detailer is heading to you now and should arrive shortly. Please make sure your vehicle is accessible.</p>
    <div style="background:#eef2ff;border-left:4px solid #6366f1;padding:20px;margin:20px 0;border-radius:4px;">
      <h3 style="margin-top:0;color:#4f46e5;">Appointment Details</h3>
      <p><strong>Booking:</strong> ${booking.confirmationCode}</p>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Date:</strong> ${fmtDate(booking.scheduledDate)}</p>
      <p><strong>Time:</strong> ${booking.scheduledTime}</p>
      <p><strong>Address:</strong> ${booking.location.address}, ${booking.location.city}, ${booking.location.state} ${booking.location.zipCode}</p>
    </div>
    <p>If you have any questions, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    <p style="margin-top:30px;"><a href="${APP_URL}/${locale}/booking/${booking.id}/track" class="btn" style="background:#6366f1;color:white;">View Booking Details</a></p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
    headerText: 'Your Detailer Is On The Way! 🚗',
    body,
    footerLine: 'Thank you for choosing DTailWash',
  });
}

export function reviewRequestTemplate(booking: BookingEmailData): string {
  const locale = booking.locale || 'en';
  const reviewUrl = `${APP_URL}/${locale}/booking/${booking.id}/review`;
  const body = `
    <p>Hi ${booking.customer.firstName},</p>
    <p>We hope you loved your ${booking.service.name} experience! Your feedback helps us serve you better and helps other customers find great detailers.</p>
    <div style="text-align:center;">
      <p style="font-size:18px;font-weight:600;color:#333;margin-bottom:20px;">Please take 30 seconds to leave a review:</p>
      <div style="font-size:24px;color:#fbbf24;margin:20px 0;">☆ ☆ ☆ ☆ ☆</div>
    </div>
    <p style="margin-top:30px;"><a href="${reviewUrl}" class="btn" style="background:#8b5cf6;color:white;">Leave Your Review Now</a></p>
    <p style="font-size:14px;color:#6b7280;text-align:center;margin-top:20px;">
      Or copy and paste: <a href="${reviewUrl}" style="word-break:break-all;">${reviewUrl}</a>
    </p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)',
    headerText: 'How Was Your Detail? ⭐',
    body,
    footerLine: 'Thank you for choosing DTailWash',
  });
}

export function contractorApprovedTemplate(contractor: {
  fullName: string;
  locale?: string;
}): string {
  const locale = contractor.locale || 'en';
  const isEs = locale === 'es';
  const loginUrl = `${APP_URL}/${locale}/contractor/login`;

  const body = `
    <p>${isEs ? 'Hola' : 'Hi'} ${contractor.fullName},</p>
    <p>${isEs
      ? 'Tu solicitud para unirte a la red de contratistas de <strong>DTailWash</strong> ha sido aprobada.'
      : 'Your application to join the <strong>DTailWash</strong> contractor network has been approved.'}</p>
    <div style="text-align:center;">
      <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#D0B078,#c4a068);color:#131835;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:20px 0;">
        ${isEs ? 'Inicia sesión y comienza a trabajar →' : 'Log in & start accepting jobs →'}
      </a>
    </div>
    <div style="background:#f9fafb;border-left:4px solid #D0B078;padding:20px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;color:#4b5563;">${isEs ? 'Próximos pasos:' : 'Next steps:'}</p>
      <ul style="margin:10px 0 0 0;padding-left:20px;color:#4b5563;">
        <li>${isEs ? 'Inicia sesión en tu portal de contratista' : 'Log in to your contractor portal'}</li>
        <li>${isEs ? 'Configura tu disponibilidad y zona de servicio' : 'Set up your availability and service area'}</li>
        <li>${isEs ? 'Comienza a recibir y aceptar trabajos' : 'Start receiving and accepting jobs'}</li>
      </ul>
    </div>
    <p>${isEs ? '¡Bienvenido al equipo!' : 'Welcome to the team!'}<br/>${isEs ? 'El equipo de DTailWash' : 'The DTailWash Team'}</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#131835 0%,#1e2a50 100%)',
    headerText: isEs ? '¡Felicidades, estás aprobado! 🎉' : "Congratulations, You're Approved! 🎉",
    body,
    footerLine: 'DTailWash — Contractor Network',
  });
}

export function contractorRejectedTemplate(contractor: {
  fullName: string;
  locale?: string;
}): string {
  const locale = contractor.locale || 'en';
  const isEs = locale === 'es';

  const body = `
    <p>${isEs ? 'Hola' : 'Hi'} ${contractor.fullName},</p>
    <p>${isEs
      ? 'Gracias por tu interés en unirte a <strong>DTailWash</strong>. Después de revisar tu solicitud, lamentamos informarte que no podemos aprobarla en este momento.'
      : "Thank you for your interest in joining <strong>DTailWash</strong>. After reviewing your application, we're unable to approve it at this time."}</p>
    <p>${isEs
      ? 'Esto puede deberse a información incompleta, área de servicio no cubierta, u otros requisitos.'
      : 'This may be due to incomplete information, uncovered service area, or other requirements.'}</p>
    <p>${isEs
      ? 'Si crees que fue un error o tienes preguntas, no dudes en contactarnos.'
      : "If you believe this was a mistake or have questions, please don't hesitate to reach out."}</p>
    <p>${isEs ? 'Saludos,' : 'Best regards,'}<br/>${isEs ? 'El equipo de DTailWash' : 'The DTailWash Team'}</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#131835 0%,#1e2a50 100%)',
    headerText: isEs ? 'Actualización de tu solicitud' : 'Application Update',
    body,
  });
}

export function contractorPaidTemplate(booking: BookingEmailData): string {
  const body = `
    <p>Great work!</p>
    <p>The customer has approved booking <strong>${booking.confirmationCode}</strong>. Your payment will be processed per your agreement.</p>
    <p>Keep up the great work!</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
    headerText: 'Job Approved! 💰',
    body,
  });
}

export function paymentReminderTemplate(
  booking: BookingEmailData,
  reminderNumber: 1 | 2 | 3,
): string {
  const { customer, service } = booking;
  const payUrl = `${APP_URL}/en/booking/${booking.id}/pay`;
  const cancelUrl = `${APP_URL}/en/dashboard`;

  const configs = {
    1: {
      headline: 'Your booking is still waiting',
      body: `You started a booking for <strong>${service.name}</strong> a few minutes ago but haven't completed payment yet. Your spot is still reserved — tap below to finish.`,
      urgency: '',
      cta: 'Complete Payment →',
    },
    2: {
      headline: "Don't lose your appointment",
      body: `Your <strong>${service.name}</strong> appointment is still pending payment. We're holding your spot, but it won't last forever.`,
      urgency: 'Your appointment is <strong>not confirmed</strong> until payment is received.',
      cta: 'Pay Now →',
    },
    3: {
      headline: 'Last chance to keep your appointment',
      body: `This is your final reminder for <strong>${service.name}</strong>. If payment is not completed today, your booking will be automatically cancelled and the spot released.`,
      urgency: '⚠️ Your booking will be <strong>cancelled</strong> if not paid within the next few hours.',
      cta: "Complete Payment Before It's Gone →",
    },
  } as const;

  const c = configs[reminderNumber];

  const body = `
    <p>Hi ${customer.firstName},</p>
    <p>${c.body}</p>
    ${c.urgency ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:4px;font-size:14px;">${c.urgency}</div>` : ''}
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;"><span>Service</span><strong>${service.name}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;"><span>Date</span><strong>${new Date(booking.scheduledDate).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;"><span>Amount</span><strong>$${Number(booking.totalAmount).toFixed(2)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span>Confirmation</span><strong>${booking.confirmationCode}</strong></div>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${payUrl}" class="btn" style="background:#f59e0b;color:white;padding:14px 28px;font-size:16px;">${c.cta}</a>
    </div>
    <p style="font-size:13px;color:#6b7280;">Don't want this appointment? <a href="${cancelUrl}" style="color:#9ca3af;">Cancel from your dashboard</a></p>
    <p style="font-size:13px;color:#6b7280;">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or ${SUPPORT_PHONE}.</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
    headerText: c.headline,
    body,
  });
}

const PAYMENT_METHOD_LABELS: Record<string, { en: string; es: string }> = {
  ach:   { en: 'ACH / Direct Deposit', es: 'ACH / Depósito Directo' },
  zelle: { en: 'Zelle',               es: 'Zelle'                  },
  check: { en: 'Check',               es: 'Cheque'                 },
  cash:  { en: 'Cash',                es: 'Efectivo'               },
};

export function payoutConfirmationTemplate(data: PayoutEmailData): string {
  const isEs = data.locale === 'es';
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00Z').toLocaleDateString(isEs ? 'es-US' : 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  const methodLabel =
    PAYMENT_METHOD_LABELS[data.paymentMethod]?.[isEs ? 'es' : 'en'] ?? data.paymentMethod;

  const body = `
    <p>${isEs ? `Hola ${data.contractorName},` : `Hi ${data.contractorName},`}</p>
    <p>${isEs
      ? 'Tu pago semanal ha sido enviado. Aquí están los detalles:'
      : 'Your weekly payout has been sent. Here are the details:'}</p>
    <div style="background:#f9fafb;border-left:4px solid #D0B078;padding:20px;margin:20px 0;border-radius:4px;">
      <div style="display:flex;justify-content:space-between;margin:8px 0;"><span style="font-weight:600;color:#6b7280;">${isEs ? 'Período' : 'Period'}:</span><span>${fmt(data.periodStart)} – ${fmt(data.periodEnd)}</span></div>
      <div style="display:flex;justify-content:space-between;margin:8px 0;"><span style="font-weight:600;color:#6b7280;">${isEs ? 'Trabajos completados' : 'Completed jobs'}:</span><span>${data.totalBookings}</span></div>
      <div style="display:flex;justify-content:space-between;margin:8px 0;border-top:2px solid #D0B078;padding-top:12px;"><span style="font-weight:600;color:#6b7280;">${isEs ? 'Tu pago' : 'Your payout'}:</span><span style="font-size:1.2em;font-weight:bold;color:#16a34a;">$${Number(data.contractorAmount).toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;margin:16px 0 8px;"><span style="font-weight:600;color:#6b7280;">${isEs ? 'Método de pago' : 'Payment method'}:</span><span>${methodLabel}</span></div>
      ${data.notes ? `<div style="display:flex;justify-content:space-between;margin:8px 0;"><span style="font-weight:600;color:#6b7280;">${isEs ? 'Notas' : 'Notes'}:</span><span>${data.notes}</span></div>` : ''}
    </div>
    <p>${isEs
      ? `¿Preguntas? Contáctanos en <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> o llama al ${SUPPORT_PHONE}.`
      : `Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.`}</p>`;

  return baseLayout({
    headerGradient: 'linear-gradient(135deg,#1a2142 0%,#131835 100%)',
    headerText: isEs ? 'Pago Enviado' : 'Payment Sent',
    body,
    footerLine: `DTailWash · Miami-Dade County · <a href="${APP_URL}">${APP_URL}</a>`,
  });
}
