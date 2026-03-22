import { Resend } from 'resend';

// Initialize Resend lazily — avoids crash when RESEND_API_KEY is not yet set
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

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@dtailwash.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dtailwash.com';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '(305) 000-0000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

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
  service: {
    name: string;
  };
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
    profilePhoto?: any;
  };
  beforePhotos?: any[];
  afterPhotos?: any[];
  notes?: string;
  paymentIntentId?: string;
  locale?: 'en' | 'es';
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(booking: BookingEmailData) {
  try {
    const { customer, service, location } = booking;

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .detail-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: 600; color: #6b7280; }
              .value { color: #111827; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚗 Booking Confirmed!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.firstName},</p>
              
              <p>Great news! Your detailing appointment has been confirmed. We can't wait to make your vehicle shine!</p>
              
              <div class="detail-box">
                <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
                <div class="detail-row">
                  <span class="label">Confirmation Code:</span>
                  <span class="value"><strong>${booking.confirmationCode}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Service:</span>
                  <span class="value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${booking.scheduledTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Location:</span>
                  <span class="value">${location.address}, ${location.city}, ${location.state} ${location.zipCode}</span>
                </div>
                ${booking.vehicle && (booking.vehicle.make || booking.vehicle.model) ? `
                <div class="detail-row">
                  <span class="label">Vehicle:</span>
                  <span class="value">${booking.vehicle.year || ''} ${booking.vehicle.make || ''} ${booking.vehicle.model || ''} - ${booking.vehicle.color || ''}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="label">Total Amount:</span>
                  <span class="value"><strong>$${booking.totalAmount.toFixed(2)}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Status:</span>
                  <span class="value"><span class="highlight">Authorized (charged when service complete)</span></span>
                </div>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                <li>We're assigning a professional detailer to your appointment</li>
                <li>You'll receive an introduction email within 30 minutes</li>
                <li>Your detailer will arrive at the scheduled time</li>
              </ul>
              
              <p style="margin-top: 30px;">
                <a href="${APP_URL}/en/booking/${booking.id}" class="button">View Booking Details</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Need to make changes? Reply to this email or call us at ${SUPPORT_PHONE}
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing DetailWash</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
        `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: 'Your Detailing Appointment is Confirmed! 🚗',
      html,
    });

    if (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }

    console.log(`Booking confirmation email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send booking confirmation:', error);
    throw error;
  }
}

/**
 * Send new job notification to contractor
 */
export async function sendNewJobToContractor(booking: BookingEmailData, contractorEmail: string) {
  try {
    const { customer, service, location } = booking;

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .job-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
              .label { font-weight: 600; color: #065f46; }
              .value { color: #111827; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💼 New Job Assigned!</h1>
            </div>

            <div class="content">
              <p><strong>You have a new detailing appointment!</strong></p>

              <div class="job-box">
                <h3 style="margin-top: 0; color: #065f46;">Job Details</h3>
                <div class="detail-row">
                  <span class="label">Confirmation Code:</span>
                  <span class="value"><strong>${booking.confirmationCode}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Service:</span>
                  <span class="value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${booking.scheduledTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Location:</span>
                  <span class="value">${location.address}, ${location.city}, ${location.state} ${location.zipCode}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Customer:</span>
                  <span class="value">${customer.firstName} ${customer.lastName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Contact:</span>
                  <span class="value">${customer.phone}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Your Earnings:</span>
                  <span class="value"><strong>$${(booking.totalAmount * 0.85).toFixed(2)}</strong> (85% of $${booking.totalAmount.toFixed(2)})</span>
                </div>
              </div>

              <h3>Next Steps:</h3>
              <ul>
                <li>Review the job details in your dashboard</li>
                <li>Prepare your equipment and supplies</li>
                <li>Contact customer if you need additional information</li>
                <li>Arrive on time and provide excellent service!</li>
              </ul>

              <p style="margin-top: 30px; text-align: center;">
                <a href="${APP_URL}/en/contractor/jobs/${booking.id}" class="button">View Job Details</a>
              </p>
            </div>

            <div class="footer">
              <p>DetailWash - Contractor Portal</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
        `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: contractorEmail,
      subject: '💼 New Job Assigned - ' + booking.confirmationCode,
      html,
    });

    if (error) {
      console.error('Error sending new job email to contractor:', error);
      throw error;
    }

    console.log(`New job email sent to contractor ${contractorEmail}`);
    return data;
  } catch (error) {
    console.error('Failed to send new job email to contractor:', error);
    throw error;
  }
}

/**
 * Send payment receipt email to customer
 */
export async function sendPaymentReceipt(booking: BookingEmailData) {
  try {
    const { customer, service, contractor } = booking;

    const contractorName = contractor ? `${contractor.firstName} ${contractor.lastName}` : 'Your Detailer';

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .receipt-box { background: #f9fafb; border: 2px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .receipt-total { display: flex; justify-content: space-between; padding: 15px 0; font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #3b82f6; margin-top: 10px; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .promo-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💳 Payment Receipt</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.firstName},</p>
              
              <p>Thank you for choosing DetailWash! Here's your receipt for the service.</p>
              
              <div class="receipt-box">
                <h3 style="margin-top: 0; color: #1e40af;">Receipt #${booking.confirmationCode}</h3>
                <p style="color: #6b7280; font-size: 14px;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="color: #6b7280; font-size: 14px;">Service Provider: ${contractorName}</p>
                
                <div style="margin-top: 20px;">
                  <div class="receipt-row">
                    <span>${service.name}</span>
                    <span>$${booking.totalAmount.toFixed(2)}</span>
                  </div>
                  <div class="receipt-total">
                    <span>Total Charged</span>
                    <span>$${booking.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                ${booking.paymentIntentId ? `
                  <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">
                    Transaction ID: ${booking.paymentIntentId}
                  </p>
                ` : ''}
              </div>
              
              <div class="promo-box">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Love your results? 🌟</h3>
                <p style="margin: 0;">
                  <a href="${APP_URL}/en/booking/${booking.id}/review" class="button">⭐ Rate Your Service</a>
                </p>
              </div>
              
              <div class="promo-box">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Book Again & Save!</h3>
                <p style="margin: 0;">Use code <strong>LOYAL10</strong> for 10% off your next service.</p>
                <p style="margin: 10px 0 0 0;">
                  <a href="${APP_URL}/en/booking/select" class="button">Schedule Another Appointment</a>
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Questions about your receipt? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
        `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: `Receipt for Your Detailing Service - $${booking.totalAmount.toFixed(2)}`,
      html,
    });

    if (error) {
      console.error('Error sending payment receipt email:', error);
      throw error;
    }

    console.log(`Payment receipt email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send payment receipt email:', error);
    throw error;
  }
}

/**
 * Send contractor application email to admin
 */
export async function sendContractorApplication(applicationData: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  serviceZipCodes: string[];
  documentsCount: number;
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .box { background: #f3f4f6; border: 1px solid #d1d5db; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .row { margin: 10px 0; }
            .label { font-weight: 600; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">New Contractor Application</h1>
          </div>
          <div class="content">
            <p>A new contractor has applied to join the network.</p>
            <div class="box">
              <div class="row"><span class="label">Name:</span> ${applicationData.fullName}</div>
              <div class="row"><span class="label">Email:</span> ${applicationData.email}</div>
              <div class="row"><span class="label">Phone:</span> ${applicationData.phone}</div>
              <div class="row"><span class="label">Address:</span> ${applicationData.address}</div>
              <div class="row"><span class="label">Business Name:</span> ${applicationData.businessName || 'N/A'}</div>
              <div class="row"><span class="label">Service ZIP Codes:</span> ${applicationData.serviceZipCodes.join(', ')}</div>
              <div class="row"><span class="label">Attached Documents:</span> ${applicationData.documentsCount} uploaded</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `New Contractor Application: ${applicationData.fullName} `,
      html,
    });

    if (error) {
      console.error('Error sending contractor application email:', error);
      throw error;
    }

    console.log(`Contractor application email sent to admin for ${applicationData.fullName}`);
    return data;
  } catch (error) {
    console.error('Failed to send contractor application email:', error);
    throw error;
  }
}

/**
 * Send application received confirmation to the contractor applicant
 */
export async function sendContractorApplicationReceived(applicationData: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  serviceZipCodes: string[];
  documentsCount: number;
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #131835 0%, #1e2a50 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .box { background: #f9fafb; border-left: 4px solid #D0B078; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Application Received! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${applicationData.fullName},</p>
            <p>Thank you for applying to join the <strong>DetailWash</strong> contractor network!</p>
            <p>We've received your application and our team will review it within <strong>1–2 business days</strong>.</p>
            <div class="box">
              <p style="margin: 0; font-weight: 600; color: #4b5563;">What happens next?</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li>Our team reviews your documents and information</li>
                <li>You'll receive an approval or follow-up email within 1–2 business days</li>
                <li>Once approved, you can set up your payments and start accepting jobs</li>
              </ul>
            </div>
            <p>In the meantime, you can log in to check your application status at <a href="${APP_URL}/en/contractor/pending">${APP_URL}</a>.</p>
            <p>Questions? Reply to this email or contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>Thanks for joining us!<br/>The DetailWash Team</p>
          </div>
          <div class="footer">
            <p>DetailWash — Contractor Network</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: applicationData.email,
      subject: 'Application Received — DetailWash',
      html,
    });

    if (error) {
      console.error('Error sending contractor application received email:', error);
      throw error;
    }

    console.log(`Contractor application received email sent to ${applicationData.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send contractor application received email:', error);
    throw error;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: { name: string; email: string }) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Welcome to DetailWash! 🚗</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>We're thrilled to have you here!</p>
            <p>First, please confirm your email using the separate confirmation email we just sent you. Once confirmed, you can log in and start booking premium auto detailing services.</p>
            <p style="text-align: center;">
              <a href="${APP_URL}/en/login" class="button">Sign in to your account</a>
            </p>
            <p>If you have any questions, just reply to this email.</p>
            <p>Happy detailing!<br/>The DetailWash Team</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to DetailWash! 🚗',
      html,
    });

    if (error) throw error;
    console.log(`Welcome email sent to ${user.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Send booking pending email (before payment)
 */
export async function sendBookingPendingEmail(booking: BookingEmailData) {
  try {
    const { customer, service } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Booking Received</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>We've received your booking request for a <strong>${service.name}</strong>.</p>
            <p>Your booking is currently marked as <strong>Pending</strong> while we process the payment authorization. Once the payment hold is successful, you will receive a confirmation email with all the details and we will assign a detailer to your job.</p>
            <p>Thank you for choosing DetailWash!</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: 'Booking Received - Pending Payment',
      html,
    });

    if (error) throw error;
    console.log(`Booking pending email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send booking pending email:', error);
    throw error;
  }
}

/**
 * Send job accepted email to customer
 */
export async function sendJobAcceptedEmail(booking: BookingEmailData) {
  try {
    const { customer, contractor } = booking;
    const contractorName = contractor ? `${contractor.firstName} ${contractor.lastName}` : 'A detailer';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Detailer Assigned! ✨</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>Great news! <strong>${contractorName}</strong> has been assigned to your booking (${booking.confirmationCode}) and will be arriving at the scheduled time.</p>
            <p>If you need to contact your detailer before they arrive or make any changes to your appointment, please visit your dashboard.</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: 'Your Detailer is Assigned!',
      html,
    });

    if (error) throw error;
    console.log(`Job accepted email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send job accepted email:', error);
    throw error;
  }
}

/**
 * Send job rejected alert to admin
 */
export async function sendJobRejectedToAdmin(booking: BookingEmailData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Alert: Job Rejected ⚠️</h1>
          </div>
          <div class="content">
            <p>A contractor has rejected an assigned job. Reassignment may be required.</p>
            <p><strong>Booking Code:</strong> ${booking.confirmationCode}</p>
            <p><strong>Customer:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
            <p><strong>Scheduled:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()} at ${booking.scheduledTime}</p>
            <p style="text-align: center;">
              <a href="${APP_URL}/en/admin/bookings" class="button">View Admin Dashboard</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `Alert: Job Rejected - ${booking.confirmationCode}`,
      html,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send job rejected email:', error);
    throw error;
  }
}

/**
 * Send booking cancelled email
 */
export async function sendBookingCancelledEmail(booking: BookingEmailData) {
  try {
    const { customer } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>Your booking <strong>${booking.confirmationCode}</strong> has been cancelled.</p>
            <p>If this was due to a payment failure, your card has not been charged.</p>
            <p>If you'd like to reschedule, please visit our website to place a new booking.</p>
            <p>Thank you,<br/>DetailWash Team</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: 'Booking Cancelled',
      html,
    });

    if (error) throw error;
    console.log(`Booking cancelled email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send booking cancelled email:', error);
    throw error;
  }
}

/**
 * Send job pending approval email to customer (Customer on-site inspection)
 */
export async function sendJobPendingApprovalEmail(booking: BookingEmailData) {
  try {
    const { customer } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; text-align: center; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 30px 0; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.4); }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Your Car is Ready! 🚘✨</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; text-align: left;">Hi ${customer.firstName},</p>
            <p style="font-size: 16px; text-align: left;">Your detailer has just finished the <strong>${booking.service.name}</strong> service!</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; text-align: left;">
              <h3 style="margin-top: 0; color: #4b5563;">Next Steps:</h3>
              <ol style="margin-bottom: 0;">
                <li>Please walk out to your vehicle and inspect the work with your detailer.</li>
                <li>Make sure everything is to your satisfaction.</li>
                <li>Click the button below to approve the job and release the final payment.</li>
              </ol>
            </div>

            <p style="color: #ef4444; font-weight: 600; font-size: 14px; text-align: left;">
              ⚠️ Note: Your card will not be charged until you click approve.
            </p>

            <a href="${APP_URL}/en/booking/${booking.id}/approve?code=${booking.confirmationCode}" class="button">
              INSPECT & APPROVE JOB
            </a>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: 'Action Required: Your Car is Ready for Inspection! ✨',
      html,
    });

    if (error) throw error;
    console.log(`Job pending approval email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send pending approval email:', error);
    throw error;
  }
}

/**
 * Send chargeback/dispute alert to admin
 */
export async function sendChargebackAlertEmail(data: {
    bookingId: string | number;
    disputeId: string;
    paymentIntentId: string;
    amount: number;
    reason: string;
}) {
    try {
        const amountFormatted = (data.amount / 100).toFixed(2);
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .row { margin: 10px 0; }
            .label { font-weight: 600; color: #4b5563; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Chargeback Alert</h1>
          </div>
          <div class="content">
            <p><strong>A customer has opened a chargeback dispute. Immediate action required.</strong></p>
            <div class="alert-box">
              <div class="row"><span class="label">Booking ID:</span> ${data.bookingId}</div>
              <div class="row"><span class="label">Dispute ID:</span> ${data.disputeId}</div>
              <div class="row"><span class="label">Payment Intent:</span> ${data.paymentIntentId}</div>
              <div class="row"><span class="label">Disputed Amount:</span> $${amountFormatted}</div>
              <div class="row"><span class="label">Reason:</span> ${data.reason}</div>
            </div>
            <p>Log into the Stripe Dashboard to respond to this dispute. You typically have <strong>7–21 days</strong> to submit evidence.</p>
            <p style="text-align: center;">
              <a href="${APP_URL}/admin/bookings/${data.bookingId}" class="button">View Booking in Admin</a>
            </p>
          </div>
        </body>
      </html>
    `;

        const { data: result, error } = await getResend().emails.send({
            from: FROM_EMAIL,
            to: SUPPORT_EMAIL,
            subject: `⚠️ Chargeback Alert — Booking ${data.bookingId} ($${amountFormatted})`,
            html,
        });

        if (error) throw error;
        console.log(`Chargeback alert email sent to admin for booking ${data.bookingId}`);
        return result;
    } catch (error) {
        console.error('Failed to send chargeback alert email:', error);
        throw error;
    }
}

/**
 * Send job approved receipt to customer
 */
export async function sendJobApprovedReceiptEmail(booking: BookingEmailData) {
  // We can reuse the existing sendPaymentReceipt, or wrap it if we want custom messaging
  // Standard receipt is fine, but we'll add the review link CTA
  return sendPaymentReceipt(booking);
}

/**
 * Send contractor job start notification email
 */
export async function sendJobStartedEmail(booking: BookingEmailData) {
  try {
    const { customer } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Detailer Has Started Work! 🚿</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>Your detailer has arrived and started working on your vehicle. They'll update you when they're finished.</p>

            <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ea580c;">Service in Progress</h3>
              <p><strong>Booking:</strong> ${booking.confirmationCode}</p>
              <p><strong>Service:</strong> ${booking.service.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.scheduledTime}</p>
            </div>

            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${booking.locale || 'en'}/booking/${booking.id}" class="button">View Booking Details</a>
            </p>
          </div>

          <div class="footer">
            <p>Thank you for choosing DetailWash</p>
            <p>Questions? <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}">${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}</a></p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: process.env.FROM_EMAIL || 'notifications@dtailwash.com',
      to: customer.email,
      subject: 'Your Detailer Has Started Work! 🚿',
      html,
    });

    if (error) throw error;
    console.log(`Job started email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send job started email:', error);
    throw error;
  }
}

/**
 * Send "on the way" email to customer when contractor marks en_route
 */
export async function sendEnRouteEmail(booking: BookingEmailData) {
  try {
    const { customer } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Your Detailer Is On The Way! 🚗</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>Great news! Your detailer is heading to you now and should arrive shortly. Please make sure your vehicle is accessible.</p>

            <div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Appointment Details</h3>
              <p><strong>Booking:</strong> ${booking.confirmationCode}</p>
              <p><strong>Service:</strong> ${booking.service.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${booking.scheduledTime}</p>
              <p><strong>Address:</strong> ${booking.location.address}, ${booking.location.city}, ${booking.location.state} ${booking.location.zipCode}</p>
            </div>

            <p>If you have any questions or need to reach your detailer, please contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}">${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}</a>.</p>

            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${booking.locale || 'en'}/booking/${booking.id}" class="button">View Booking Details</a>
            </p>
          </div>

          <div class="footer">
            <p>Thank you for choosing DetailWash</p>
            <p>Questions? <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}">${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}</a></p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: process.env.FROM_EMAIL || 'notifications@dtailwash.com',
      to: customer.email,
      subject: 'Your Detailer Is On The Way! 🚗',
      html,
    });

    if (error) throw error;
    console.log(`En-route email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send en-route email:', error);
    throw error;
  }
}

/**
 * Send review request email after job completion
 */
export async function sendReviewRequestEmail(booking: BookingEmailData) {
  try {
    const { customer, service } = booking;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .star-rating { display: flex; justify-content: center; gap: 8px; margin: 20px 0; }
            .star { font-size: 24px; color: #fbbf24; cursor: pointer; }
            .star.empty { color: #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">How Was Your Detail? ⭐</h1>
          </div>
          <div class="content">
            <p>Hi ${customer.firstName},</p>
            <p>We hope you loved your ${service.name} experience! Your feedback helps us serve you better and helps other customers find great detailers.</p>

            <div style="text-align: center;">
              <p style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 20px;">
                Please take 30 seconds to leave a review:
              </p>
              <div class="star-rating" id="star-rating">
                <!-- Stars will be filled via JS in email client that supports it -->
                <span class="star" data-value="1">☆</span>
                <span class="star" data-value="2">☆</span>
                <span class="star" data-value="3">☆</span>
                <span class="star" data-value="4">☆</span>
                <span class="star" data-value="5">☆</span>
              </div>
            </div>

            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${booking.locale || 'en'}/booking/${booking.id}/review" class="button">
                Leave Your Review Now
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
              Or copy and paste this link into your browser:<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${booking.locale || 'en'}/booking/${booking.id}/review" style="word-break: break-all;">
                ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${booking.locale || 'en'}/booking/${booking.id}/review
              </a>
            </p>
          </div>

          <div class="footer">
            <p>Thank you for choosing DetailWash</p>
            <p>Questions? <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}">${process.env.SUPPORT_EMAIL || 'support@dtailwash.com'}</a></p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: process.env.FROM_EMAIL || 'notifications@dtailwash.com',
      to: customer.email,
      subject: 'How Was Your Detail? Leave a Review ⭐',
      html,
    });

    if (error) throw error;
    console.log(`Review request email sent to ${customer.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send review request email:', error);
    throw error;
  }
}

/**
 * Send contractor paid notification
 */
/**
 * Send approval email to contractor with login link
 */
export async function sendContractorApprovedEmail(contractor: {
  fullName: string;
  email: string;
  locale?: string;
}) {
  try {
    const locale = contractor.locale || 'en';
    const loginUrl = `${APP_URL}/${locale}/contractor/login`;
    const isEs = locale === 'es';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #131835 0%, #1e2a50 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #D0B078, #c4a068); color: #131835; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
            .box { background: #f9fafb; border-left: 4px solid #D0B078; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${isEs ? '¡Felicidades, estás aprobado!' : 'Congratulations, You\'re Approved!'} 🎉</h1>
          </div>
          <div class="content">
            <p>${isEs ? 'Hola' : 'Hi'} ${contractor.fullName},</p>
            <p>${isEs
              ? 'Tu solicitud para unirte a la red de contratistas de <strong>DetailWash</strong> ha sido aprobada.'
              : 'Your application to join the <strong>DetailWash</strong> contractor network has been approved.'}</p>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="cta">${isEs ? 'Inicia sesión y comienza a trabajar →' : 'Log in & start accepting jobs →'}</a>
            </div>
            <div class="box">
              <p style="margin: 0; font-weight: 600; color: #4b5563;">${isEs ? 'Próximos pasos:' : 'Next steps:'}</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li>${isEs ? 'Inicia sesión en tu portal de contratista' : 'Log in to your contractor portal'}</li>
                <li>${isEs ? 'Configura tu disponibilidad y zona de servicio' : 'Set up your availability and service area'}</li>
                <li>${isEs ? 'Comienza a recibir y aceptar trabajos' : 'Start receiving and accepting jobs'}</li>
              </ul>
            </div>
            <p>${isEs ? '¡Bienvenido al equipo!' : 'Welcome to the team!'}<br/>${isEs ? 'El equipo de DetailWash' : 'The DetailWash Team'}</p>
          </div>
          <div class="footer">
            <p>DetailWash — Contractor Network</p>
            <p><a href="mailto:${SUPPORT_EMAIL}" style="color: #D0B078;">${SUPPORT_EMAIL}</a> · ${SUPPORT_PHONE}</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: contractor.email,
      subject: isEs ? '¡Aprobado! Bienvenido a DetailWash 🎉' : 'You\'re Approved! Welcome to DetailWash 🎉',
      html,
    });

    if (error) throw error;
    console.log(`Contractor approved email sent to ${contractor.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send contractor approved email:', error);
    throw error;
  }
}

/**
 * Send rejection email to contractor
 */
export async function sendContractorRejectedEmail(contractor: {
  fullName: string;
  email: string;
  locale?: string;
}) {
  try {
    const locale = contractor.locale || 'en';
    const isEs = locale === 'es';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #131835 0%, #1e2a50 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${isEs ? 'Actualización de tu solicitud' : 'Application Update'}</h1>
          </div>
          <div class="content">
            <p>${isEs ? 'Hola' : 'Hi'} ${contractor.fullName},</p>
            <p>${isEs
              ? 'Gracias por tu interés en unirte a <strong>DetailWash</strong>. Después de revisar tu solicitud, lamentamos informarte que no podemos aprobarla en este momento.'
              : 'Thank you for your interest in joining <strong>DetailWash</strong>. After reviewing your application, we\'re unable to approve it at this time.'}</p>
            <p>${isEs
              ? 'Esto puede deberse a información incompleta, área de servicio no cubierta, u otros requisitos.'
              : 'This may be due to incomplete information, uncovered service area, or other requirements.'}</p>
            <p>${isEs
              ? 'Si crees que fue un error o tienes preguntas, no dudes en contactarnos.'
              : 'If you believe this was a mistake or have questions, please don\'t hesitate to reach out.'}</p>
            <p>${isEs ? 'Saludos,' : 'Best regards,'}<br/>${isEs ? 'El equipo de DetailWash' : 'The DetailWash Team'}</p>
          </div>
          <div class="footer">
            <p><a href="mailto:${SUPPORT_EMAIL}" style="color: #D0B078;">${SUPPORT_EMAIL}</a> · ${SUPPORT_PHONE}</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: contractor.email,
      subject: isEs ? 'Actualización de tu solicitud — DetailWash' : 'Application Update — DetailWash',
      html,
    });

    if (error) throw error;
    console.log(`Contractor rejected email sent to ${contractor.email}`);
    return data;
  } catch (error) {
    console.error('Failed to send contractor rejected email:', error);
    throw error;
  }
}

export async function sendContractorPaidEmail(contractorEmail: string, booking: BookingEmailData) {
  try {
    const amount = (booking.totalAmount * 0.85).toFixed(2); // 85% contractor payout
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Job Approved & Paid! 💰</h1>
          </div>
          <div class="content">
            <p>Great work!</p>
            <p>The customer has approved booking <strong>${booking.confirmationCode}</strong>.</p>
            <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600; text-transform: uppercase;">Earnings Added to Balance</p>
              <h2 style="margin: 5px 0 0 0; color: #059669; font-size: 32px;">$${amount}</h2>
            </div>
            <p>This amount will be included in your next Stripe payout according to your payout schedule.</p>
            <p>Keep up the great work!</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: contractorEmail,
      subject: `Job Approved! You earned $${amount} 💰`,
      html,
    });

    if (error) throw error;
    console.log(`Contractor paid email sent to ${contractorEmail}`);
    return data;
  } catch (error) {
    console.error('Failed to send contractor paid email:', error);
    throw error;
  }
}

/**
 * Payment reminder emails — 3 escalating tones
 * reminderNumber: 1 = 15 min, 2 = 2 hours, 3 = 24 hours (final)
 */
export async function sendPaymentReminderEmail(booking: BookingEmailData, reminderNumber: 1 | 2 | 3) {
  const { customer, service } = booking;
  const payUrl = `${APP_URL}/en/booking/${booking.id}/pay`;
  const cancelUrl = `${APP_URL}/en/dashboard`;

  const configs = {
    1: {
      subject: `Complete your booking — ${service.name}`,
      headline: 'Your booking is still waiting',
      body: `You started a booking for <strong>${service.name}</strong> a few minutes ago but haven't completed payment yet. Your spot is still reserved — tap below to finish.`,
      urgency: '',
      cta: 'Complete Payment →',
    },
    2: {
      subject: `Reminder: Payment needed for your ${service.name}`,
      headline: 'Don\'t lose your appointment',
      body: `Your <strong>${service.name}</strong> appointment is still pending payment. We're holding your spot, but it won't last forever.`,
      urgency: 'Your appointment is <strong>not confirmed</strong> until payment is received.',
      cta: 'Pay Now →',
    },
    3: {
      subject: `Final reminder — your booking will be released`,
      headline: 'Last chance to keep your appointment',
      body: `This is your final reminder for <strong>${service.name}</strong>. If payment is not completed today, your booking will be automatically cancelled and the spot released.`,
      urgency: '⚠️ Your booking will be <strong>cancelled</strong> if not paid within the next few hours.',
      cta: 'Complete Payment Before It\'s Gone →',
    },
  };

  const c = configs[reminderNumber];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .urgency { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; }
          .cta { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 16px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .cancel-link { font-size: 12px; color: #9ca3af; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0;font-size:22px;">${c.headline}</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.firstName},</p>
          <p>${c.body}</p>
          ${c.urgency ? `<div class="urgency">${c.urgency}</div>` : ''}

          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
            <div class="detail-row"><span>Service</span><strong>${service.name}</strong></div>
            <div class="detail-row"><span>Date</span><strong>${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong></div>
            <div class="detail-row"><span>Amount</span><strong>$${Number(booking.totalAmount).toFixed(2)}</strong></div>
            <div class="detail-row" style="border-bottom:none;"><span>Confirmation</span><strong>${booking.confirmationCode}</strong></div>
          </div>

          <div style="text-align:center;margin:24px 0;">
            <a href="${payUrl}" class="cta">${c.cta}</a>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            Don't want this appointment? <a href="${cancelUrl}" class="cancel-link">Cancel from your dashboard</a>
          </p>
          <p style="font-size:13px;color:#6b7280;">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or ${SUPPORT_PHONE}.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: c.subject,
      html,
    });
    if (error) throw error;
    console.log(`Payment reminder #${reminderNumber} sent to ${customer.email} for booking ${booking.id}`);
    return data;
  } catch (error) {
    console.error(`Failed to send payment reminder #${reminderNumber}:`, error);
    throw error;
  }
}

// ── Payout confirmation ─────────────────────────────────────────────────────

export interface PayoutEmailData {
  contractorName: string;
  contractorEmail: string;
  periodStart: string;  // 'YYYY-MM-DD'
  periodEnd: string;    // 'YYYY-MM-DD'
  totalBookings: number;
  grossAmount: number;
  platformFee: number;
  contractorAmount: number;
  paymentMethod: 'ach' | 'zelle' | 'check' | 'cash';
  notes: string | null;
  locale?: 'en' | 'es';
}

const PAYMENT_METHOD_LABELS: Record<string, { en: string; es: string }> = {
  ach:   { en: 'ACH / Direct Deposit', es: 'ACH / Depósito Directo' },
  zelle: { en: 'Zelle',               es: 'Zelle'                  },
  check: { en: 'Check',               es: 'Cheque'                 },
  cash:  { en: 'Cash',                es: 'Efectivo'               },
};

/**
 * Send weekly payout confirmation to contractor after admin marks payment sent.
 */
export async function sendPayoutConfirmation(data: PayoutEmailData) {
  const isEs = data.locale === 'es';
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00Z').toLocaleDateString(isEs ? 'es-US' : 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  const methodLabel =
    PAYMENT_METHOD_LABELS[data.paymentMethod]?.[isEs ? 'es' : 'en'] ?? data.paymentMethod;

  const subject = isEs
    ? `Pago enviado: semana del ${fmt(data.periodStart)}`
    : `Payment sent: week of ${fmt(data.periodStart)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a2142 0%, #131835 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; color: #D0B078; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .box { background: #f9fafb; border-left: 4px solid #D0B078; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { font-weight: 600; color: #6b7280; }
          .value { color: #111827; }
          .total-row { border-top: 2px solid #D0B078; margin-top: 12px; padding-top: 12px; }
          .total-value { font-size: 1.2em; font-weight: bold; color: #16a34a; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${isEs ? 'Pago Enviado' : 'Payment Sent'}</h1>
        </div>
        <div class="content">
          <p>${isEs ? `Hola ${data.contractorName},` : `Hi ${data.contractorName},`}</p>
          <p>${isEs
            ? 'Tu pago semanal ha sido enviado. Aquí están los detalles:'
            : 'Your weekly payout has been sent. Here are the details:'
          }</p>

          <div class="box">
            <div class="row">
              <span class="label">${isEs ? 'Período' : 'Period'}:</span>
              <span class="value">${fmt(data.periodStart)} – ${fmt(data.periodEnd)}</span>
            </div>
            <div class="row">
              <span class="label">${isEs ? 'Trabajos completados' : 'Completed jobs'}:</span>
              <span class="value">${data.totalBookings}</span>
            </div>
            <div class="row">
              <span class="label">${isEs ? 'Total facturado' : 'Total billed'}:</span>
              <span class="value">$${Number(data.grossAmount).toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">${isEs ? 'Comisión plataforma (30%)' : 'Platform fee (30%)'}:</span>
              <span class="value" style="color:#dc2626;">−$${Number(data.platformFee).toFixed(2)}</span>
            </div>
            <div class="row total-row">
              <span class="label">${isEs ? 'Tu pago (70%)' : 'Your payout (70%)'}:</span>
              <span class="total-value">$${Number(data.contractorAmount).toFixed(2)}</span>
            </div>
            <div class="row" style="margin-top:16px;">
              <span class="label">${isEs ? 'Método de pago' : 'Payment method'}:</span>
              <span class="value">${methodLabel}</span>
            </div>
            ${data.notes ? `<div class="row">
              <span class="label">${isEs ? 'Notas' : 'Notes'}:</span>
              <span class="value">${data.notes}</span>
            </div>` : ''}
          </div>

          <p>${isEs
            ? `¿Preguntas? Contáctanos en <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> o llama al ${SUPPORT_PHONE}.`
            : `Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.`
          }</p>
        </div>
        <div class="footer">
          <p>DTailWash · Miami-Dade County · <a href="${APP_URL}">${APP_URL}</a></p>
        </div>
      </body>
    </html>
  `;

  try {
    const { data: emailData, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.contractorEmail,
      subject,
      html,
    });
    if (error) throw error;
    console.log(`Payout confirmation sent to ${data.contractorEmail}`);
    return emailData;
  } catch (err) {
    console.error('Failed to send payout confirmation email:', err);
    throw err;
  }
}
