import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@rubensautodetail.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@rubensautodetail.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

interface BookingData {
    id: number;
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
 * Email Service
 * Handles sending all email notifications using Resend
 */
export default ({ strapi }) => ({
    /**
     * Send booking confirmation email to customer
     */
    async sendBookingConfirmation(booking: BookingData) {
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
                Need to make changes? Reply to this email or call us at (XXX) XXX-XXXX
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Rubens Auto Detail</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
      `;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: customer.email,
                subject: 'Your Detailing Appointment is Confirmed! 🚗',
                html,
            });

            if (error) {
                strapi.log.error('Error sending booking confirmation email:', error);
                throw error;
            }

            strapi.log.info(`Booking confirmation email sent to ${customer.email}`, { emailId: data?.id });
            return data;
        } catch (error) {
            strapi.log.error('Failed to send booking confirmation:', error);
            throw error;
        }
    },

    /**
     * Send contractor assignment email to customer
     */
    async sendContractorAssignment(booking: BookingData) {
        try {
            const { customer, service, contractor } = booking;

            if (!contractor) {
                throw new Error('Contractor information is required');
            }

            const contractorName = `${contractor.firstName} ${contractor.lastName}`;
            const rating = contractor.rating ? contractor.rating.toFixed(1) : 'N/A';
            const completedJobs = contractor.completedJobs || 0;

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
              .contractor-card { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .contractor-name { font-size: 20px; font-weight: bold; color: #065f46; margin: 10px 0; }
              .stats { display: flex; justify-content: center; gap: 30px; margin: 15px 0; }
              .stat { text-align: center; }
              .stat-value { font-size: 18px; font-weight: bold; color: #10b981; }
              .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>👋 Meet Your Detailer</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.firstName},</p>
              
              <p>Good news! <strong>${contractorName}</strong> will be handling your ${service.name} on ${new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
              
              <div class="contractor-card">
                <div class="contractor-name">${contractorName}</div>
                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">⭐ ${rating}</div>
                    <div class="stat-label">Rating</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${completedJobs}</div>
                    <div class="stat-label">Completed Jobs</div>
                  </div>
                </div>
              </div>
              
              <p>${contractorName} will contact you if any additional information is needed before your appointment.</p>
              
              <p style="margin-top: 30px;">
                <a href="${APP_URL}/en/booking/${booking.id}" class="button">View Appointment Details</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Looking forward to serving you!
              </p>
            </div>
            
            <div class="footer">
              <p>Rubens Auto Detail</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
      `;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: customer.email,
                subject: `Meet Your Detailer - ${contractorName}`,
                html,
            });

            if (error) {
                strapi.log.error('Error sending contractor assignment email:', error);
                throw error;
            }

            strapi.log.info(`Contractor assignment email sent to ${customer.email}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send contractor assignment email:', error);
            throw error;
        }
    },

    /**
     * Send service completion email to customer
     */
    async sendServiceCompletion(booking: BookingData) {
        try {
            const { customer, service, contractor } = booking;

            if (!contractor) {
                throw new Error('Contractor information is required');
            }

            const contractorName = `${contractor.firstName} ${contractor.lastName}`;
            const photoCount = (booking.beforePhotos?.length || 0) + (booking.afterPhotos?.length || 0);

            const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .alert-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .alert-title { font-size: 18px; font-weight: bold; color: #92400e; margin-bottom: 10px; }
              .button-primary { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: 600; }
              .button-secondary { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: 600; }
              .notes-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; font-style: italic; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✨ Your Service is Complete!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.firstName},</p>
              
              <p><strong>${contractorName}</strong> has completed your ${service.name}!</p>
              
              <p><strong>Service Summary:</strong></p>
              <ul>
                <li>Completed: ${new Date(booking.completedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</li>
                <li>Photos: ${photoCount} before & after photos available</li>
              </ul>
              
              ${booking.notes ? `
                <div class="notes-box">
                  <strong>Contractor Notes:</strong><br>
                  "${booking.notes}"
                </div>
              ` : ''}
              
              <div class="alert-box">
                <div class="alert-title">⚠️ ACTION REQUIRED ⚠️</div>
                <p>Please inspect your vehicle and:</p>
                <p>
                  <a href="${APP_URL}/en/booking/${booking.id}/approve" class="button-primary">✓ Approve Service</a>
                  <a href="${APP_URL}/en/booking/${booking.id}/report" class="button-secondary">⚠ Report an Issue</a>
                </p>
                <p style="font-size: 14px; color: #92400e; margin-top: 15px;">
                  If no action is taken within 24 hours, the service will be automatically approved and payment of <strong>$${booking.totalAmount.toFixed(2)}</strong> will be processed.
                </p>
              </div>
              
              <p style="margin-top: 30px;">
                <a href="${APP_URL}/en/booking/${booking.id}" class="button-primary">View Photos & Details</a>
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Rubens Auto Detail!</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
      `;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: customer.email,
                subject: 'Your Service is Complete! Please Inspect ✨',
                html,
            });

            if (error) {
                strapi.log.error('Error sending service completion email:', error);
                throw error;
            }

            strapi.log.info(`Service completion email sent to ${customer.email}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send service completion email:', error);
            throw error;
        }
    },

    /**
     * Send payment receipt email to customer
     */
    async sendPaymentReceipt(booking: BookingData) {
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

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: customer.email,
                subject: `Receipt for Your Detailing Service - $${booking.totalAmount.toFixed(2)}`,
                html,
            });

            if (error) {
                strapi.log.error('Error sending payment receipt email:', error);
                throw error;
            }

            strapi.log.info(`Payment receipt email sent to ${customer.email}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send payment receipt email:', error);
            throw error;
        }
    },

    /**
     * Send new job notification to contractor
     */
    async sendNewJobToContractor(booking: BookingData, contractorEmail: string) {
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

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: contractorEmail,
                subject: '💼 New Job Assigned - ' + booking.confirmationCode,
                html,
            });

            if (error) {
                strapi.log.error('Error sending new job email to contractor:', error);
                throw error;
            }

            strapi.log.info(`New job email sent to contractor ${contractorEmail}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send new job email to contractor:', error);
            throw error;
        }
    },

    /**
     * Send payment received notification to contractor
     */
    async sendPaymentToContractor(booking: BookingData, contractorEmail: string, contractorEarnings: number) {
        try {
            const { customer, service } = booking;

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
              .earnings-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .amount { font-size: 48px; font-weight: bold; color: #1e40af; margin: 20px 0; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💰 Payment Received!</h1>
            </div>

            <div class="content">
              <p><strong>Great news! Your payment has been processed.</strong></p>

              <div class="earnings-box">
                <div style="font-size: 18px; color: #1e40af; margin-bottom: 10px;">Your Earnings</div>
                <div class="amount">$${contractorEarnings.toFixed(2)}</div>
                <div style="color: #6b7280; font-size: 14px;">
                  Job: ${booking.confirmationCode}<br>
                  Customer: ${customer.firstName} ${customer.lastName}<br>
                  Service: ${service.name}
                </div>
              </div>

              <p>This payment will be transferred to your connected bank account within 2-3 business days.</p>

              <p><strong>Payment Breakdown:</strong></p>
              <ul>
                <li>Service Total: $${booking.totalAmount.toFixed(2)}</li>
                <li>Platform Fee (15%): -$${(booking.totalAmount * 0.15).toFixed(2)}</li>
                <li><strong>Your Earnings (85%): $${contractorEarnings.toFixed(2)}</strong></li>
              </ul>

              <p style="margin-top: 30px; text-align: center;">
                <a href="${APP_URL}/en/contractor/earnings" class="button">View Earnings Dashboard</a>
              </p>
            </div>

            <div class="footer">
              <p>Thank you for being part of our team!</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
      `;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: contractorEmail,
                subject: `💰 Payment Received - $${contractorEarnings.toFixed(2)}`,
                html,
            });

            if (error) {
                strapi.log.error('Error sending payment notification to contractor:', error);
                throw error;
            }

            strapi.log.info(`Payment notification sent to contractor ${contractorEmail}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send payment notification to contractor:', error);
            throw error;
        }
    },

    /**
     * Send auto-approval warning email to customer
     */
    async sendAutoApprovalWarning(booking: BookingData, hoursRemaining: number) {
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
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .warning-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .countdown { font-size: 36px; font-weight: bold; color: #92400e; margin: 15px 0; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⏰ Reminder: Please Review Your Service</h1>
            </div>
            
            <div class="content">
              <p>Hi ${customer.firstName},</p>
              
              <p>This is a friendly reminder that your ${service.name} was completed on ${new Date(booking.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.</p>
              
              <div class="warning-box">
                <div style="font-size: 18px; color: #92400e;">⚠️ Automatic approval in</div>
                <div class="countdown">${hoursRemaining} hours</div>
              </div>
              
              <p>Please take a moment to:</p>
              <ul>
                <li>Review the before & after photos</li>
                <li>Inspect your vehicle</li>
                <li>Approve the service or report any issues</li>
              </ul>
              
              <p style="margin-top: 30px; text-align: center;">
                <a href="${APP_URL}/en/booking/${booking.id}/approve" class="button">Review Service Now</a>
              </p>
              
              <p style="color: #92400e; background: #fef3c7; padding: 15px; border-radius: 6px; font-size: 14px;">
                <strong>Important:</strong> If we don't hear from you within ${hoursRemaining} hours, we'll automatically approve the service and process your payment of $${booking.totalAmount.toFixed(2)}.
              </p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Rubens Auto Detail!</p>
              <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </body>
        </html>
      `;

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: customer.email,
                subject: `⏰ Reminder: Please Review Your Service (${hoursRemaining}h remaining)`,
                html,
            });

            if (error) {
                strapi.log.error('Error sending auto-approval warning email:', error);
                throw error;
            }

            strapi.log.info(`Auto-approval warning email sent to ${customer.email}`);
            return data;
        } catch (error) {
            strapi.log.error('Failed to send auto-approval warning email:', error);
            throw error;
        }
    },
});
