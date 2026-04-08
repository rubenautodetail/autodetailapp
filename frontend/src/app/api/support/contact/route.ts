/**
 * POST /api/support/contact
 * Sends a customer support message to support@dtailwash.com via Resend.
 * Also sends an auto-reply confirmation to the customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Simple in-memory rate limiter: max 5 submissions per IP per hour
const ipMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = ipMap.get(ip);
    if (!entry || now > entry.resetAt) {
        ipMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return false;
    }
    if (entry.count >= 5) return true;
    entry.count++;
    return false;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@dtailwash.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dtailwash.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getResend(): Resend {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured.');
    }
    return new Resend(process.env.RESEND_API_KEY);
}

const CATEGORY_LABELS: Record<string, string> = {
    complaint: 'Complaint',
    suggestion: 'Suggestion',
    question: 'Question',
    request: 'Request',
    other: 'Other',
};

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { name, email, category, subject, message } = body as {
            name?: string;
            email?: string;
            category?: string;
            subject?: string;
            message?: string;
        };

        if (!email?.trim() || !message?.trim() || !subject?.trim()) {
            return NextResponse.json({ error: 'email, subject, and message are required' }, { status: 400 });
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (message.length > 5000) {
            return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
        }

        const categoryLabel = CATEGORY_LABELS[category ?? 'other'] ?? 'Other';
        const sanitized = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

        const resend = getResend();

        // ── 1. Send to support inbox ──────────────────────────────────────────
        const supportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #131835 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .badge { display: inline-block; background: rgba(208,176,120,0.2); color: #D0B078; border: 1px solid #D0B078; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
    .field-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { color: #111827; margin-bottom: 20px; }
    .message-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #374151; line-height: 1.7; }
    .reply-note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; color: #92400e; font-size: 13px; margin-top: 20px; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:22px;">New Support Message</h1>
    <div class="badge">${categoryLabel}</div>
  </div>
  <div class="content">
    <div class="field-label">From</div>
    <div class="field-value">${sanitized(name || 'Unknown')} &lt;${sanitized(email)}&gt;</div>

    <div class="field-label">Subject</div>
    <div class="field-value">${sanitized(subject)}</div>

    <div class="field-label">Category</div>
    <div class="field-value">${categoryLabel}</div>

    <div class="field-label">Message</div>
    <div class="message-box">${sanitized(message)}</div>

    <div class="reply-note">
      💡 Reply directly to this email to respond to ${sanitized(name || 'the customer')}.
    </div>
  </div>
  <div class="footer">DTailWash Support · ${APP_URL}</div>
</body>
</html>`;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: SUPPORT_EMAIL,
            replyTo: email,
            subject: `[${categoryLabel}] ${subject}`,
            html: supportHtml,
        });

        // ── 2. Auto-reply confirmation to customer ────────────────────────────
        const confirmHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #131835 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
    .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #374151; margin: 20px 0; line-height: 1.7; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;font-size:22px;">We got your message ✓</h1>
  </div>
  <div class="content">
    <p>Hi ${sanitized(name || 'there')},</p>
    <p>Thanks for reaching out! We've received your <strong>${categoryLabel.toLowerCase()}</strong> and our team will get back to you as soon as possible.</p>

    <div class="summary-box">
      <strong>Subject:</strong> ${sanitized(subject)}<br>
      <strong>Your message:</strong><br>${sanitized(message)}
    </div>

    <p>In the meantime, if you have an urgent issue you can also reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    <p>— The DTailWash Team</p>
  </div>
  <div class="footer">DTailWash · <a href="${APP_URL}" style="color:#9ca3af;">${APP_URL}</a></div>
</body>
</html>`;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `We received your message – DTailWash Support`,
            html: confirmHtml,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Support contact error:', error);
        return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }
}
