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
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@rubensautodetail.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@rubensautodetail.com';
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
              <p>Thank you for choosing Rubens Auto Detail</p>
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
              <p>Rubens Auto Detail - Contractor Portal</p>
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
              
              <p>Thank you for choosing Rubens Auto Detail! Here's your receipt for the service.</p>
              
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
            <p>Thank you for applying to join the <strong>Rubens Auto Detail</strong> contractor network!</p>
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
            <p>Thanks for joining us!<br/>The Rubens Auto Detail Team</p>
          </div>
          <div class="footer">
            <p>Rubens Auto Detail — Contractor Network</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: applicationData.email,
      subject: 'Application Received — Rubens Auto Detail',
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
            <h1 style="margin: 0; font-size: 24px;">Welcome to Rubens Auto Detail! 🚗</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>We're thrilled to have you here! Your account is ready to go.</p>
            <p>You can now book premium auto detailing services directly to your location, manage your vehicles, and track your appointments all from your dashboard.</p>
            <p style="text-align: center;">
              <a href="${APP_URL}/en/dashboard" class="button">Go to Dashboard</a>
            </p>
            <p>If you have any questions, just reply to this email.</p>
            <p>Happy detailing!<br/>The Rubens Auto Detail Team</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to Rubens Auto Detail! 🚗',
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
            <p>Thank you for choosing Rubens Auto Detail!</p>
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
            <p>Thank you,<br/>Rubens Auto Detail Team</p>
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
 * Send job approved receipt to customer
 */
export async function sendJobApprovedReceiptEmail(booking: BookingEmailData) {
  // We can reuse the existing sendPaymentReceipt, or wrap it if we want custom messaging
  // Standard receipt is fine, but we'll add the review link CTA
  return sendPaymentReceipt(booking);
}

/**
 * Send contractor paid notification
 */
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
