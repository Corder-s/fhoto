/**
 * Transactional Email Service & Delivery Tracker
 *
 * Supports Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD), generic SMTP,
 * or resilient development sandbox logging with structured delivery auditing.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface EmailRecipient {
  email: string;
  name?: string;
  userId?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient;
  subject: string;
  templateName: string;
  eventType: string;
  html: string;
  text?: string;
  relatedEntityId?: string;
  idempotencyKey?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  logId?: string;
  messageId?: string;
  skippedDuplicate?: boolean;
  unconfigured?: boolean;
  error?: string;
}

/**
 * Check whether live SMTP email credentials are configured in the environment.
 */
export function isEmailConfigured(): boolean {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  return Boolean((gmailUser && gmailPass) || (smtpHost && smtpUser && smtpPass));
}

/**
 * Create or reuse a verified nodemailer transport instance.
 */
function getSmtpTransporter(): Transporter | null {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Gmail SMTP (Preferred)
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser.trim(),
        // Google app passwords may contain spaces in UI copy; strip them clean
        pass: gmailPass.replace(/\s+/g, ''),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  // 2. Generic SMTP (Custom provider / Amazon SES / SendGrid SMTP relay)
  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host: smtpHost.trim(),
      port,
      secure: isSecure,
      auth: {
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return null;
}

/**
 * Resolve sender address with proper brand header
 */
function getSenderAddress(): string {
  if (process.env.EMAIL_FROM_ADDRESS) {
    return process.env.EMAIL_FROM_ADDRESS.trim();
  }
  const senderUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  if (senderUser) {
    return `"SnapShoot Visual Marketplace" <${senderUser.trim()}>`;
  }
  return '"SnapShoot Visual Marketplace" <noreply@snapshoot.in>';
}

/**
 * Standard brand email shell wrapper with responsive styling
 */
function wrapBrandEmail(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5F0; margin: 0; padding: 24px; color: #1A1816; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4DA; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header { background: #1A1816; padding: 28px 32px; text-align: left; }
    .logo { color: #FFFFFF; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; }
    .logo span { color: #FF6E00; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .badge-brand { background: #FFF3EB; color: #FF6E00; border: 1px solid #FFD9C0; }
    .badge-success { background: #E7F6ED; color: #1E7D46; border: 1px solid #C5E8D2; }
    .badge-danger { background: #FDE8E8; color: #9B1C1C; border: 1px solid #F8B4B4; }
    .card { background: #FAF7F2; border: 1px solid #EFEAE1; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #FF6E00; color: #FFFFFF !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin-top: 16px; text-align: center; }
    .footer { background: #FAF7F2; padding: 20px 32px; font-size: 12px; color: #736B63; border-top: 1px solid #EFEAE1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://snapshoot.in" class="logo">SNAP<span>SHOOT</span></a>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} SnapShoot Marketplace Inc. All rights reserved.</p>
      <p style="margin: 0;">Securing creator bookings and client photography workflows across India.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * HTML Templates for Platform Events
 */
export const EmailTemplates = {
  authOtp(name: string, otpCode: string, expiryMinutes = 10): { subject: string; html: string } {
    const subject = `Your SnapShoot Verification Code: ${otpCode}`;
    const html = wrapBrandEmail(
      'Verify Your Account',
      `
      <span class="badge badge-brand">One-Time Password</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">Welcome to SnapShoot, ${name || 'Visual Creator'}</h2>
      <p>Use the following 6-digit verification code to complete your sign-in or account registration. This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FF6E00; background: #FFF3EB; border: 2px dashed #FF6E00; padding: 12px 24px; border-radius: 12px;">${otpCode}</span>
      </div>
      <p style="font-size: 13px; color: #736B63;">If you did not request this verification code, please ignore this email or reach out to support@snapshoot.in immediately.</p>
      `
    );
    return { subject, html };
  },

  photographerApproved(photographerName: string, dashboardUrl = 'https://snapshoot.in/photographer/dashboard'): { subject: string; html: string } {
    const subject = 'Congratulations! Your Photographer Profile Has Been Approved';
    const html = wrapBrandEmail(
      'Profile Approved',
      `
      <span class="badge badge-success">Application Approved</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">Congratulations, ${photographerName}!</h2>
      <p>Our platform verification team has reviewed your identity documents, equipment credentials, and portfolio showcase. <strong>Your photographer profile is now fully approved and published on the SnapShoot public discovery catalogue!</strong></p>
      <div class="card">
        <p style="margin: 0 0 8px; font-weight: 700;">What happens now:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Your profile and portfolio are publicly discoverable across your hub cities.</li>
          <li>Clients can browse your services, calculate distance-based pricing, and place bookings.</li>
          <li>You can manage bookings, schedules, and deliverables inside your Studio Dashboard.</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Open Photographer Dashboard →</a>
      </div>
      `
    );
    return { subject, html };
  },

  photographerRejected(photographerName: string, reason: string, resubmitUrl = 'https://snapshoot.in/photographer/onboarding'): { subject: string; html: string } {
    const subject = 'Update on Your SnapShoot Photographer Profile Application';
    const html = wrapBrandEmail(
      'Profile Review Status',
      `
      <span class="badge badge-danger">Review Decision</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">Hello ${photographerName},</h2>
      <p>Thank you for submitting your studio credentials to SnapShoot. Our review team has reviewed your application and requires updates before your profile can be published.</p>
      <div class="card" style="border-left: 4px solid #E02424;">
        <p style="margin: 0 0 6px; font-weight: 700; color: #9B1C1C;">Review Feedback / Required Changes:</p>
        <p style="margin: 0; font-style: italic; color: #4B5563;">"${reason || 'Please provide updated government identification and higher-resolution portfolio samples.'}"</p>
      </div>
      <p>You can update your profile details and re-submit your verification application at any time.</p>
      <div style="text-align: center;">
        <a href="${resubmitUrl}" class="button">Update & Resubmit Profile →</a>
      </div>
      `
    );
    return { subject, html };
  },

  bookingRequested(
    recipientName: string,
    role: 'creator' | 'customer',
    bookingRef: string,
    eventTitle: string,
    eventDate: string,
    startTime: string,
    location: string,
    totalAmount: number,
    travelDistanceKm?: number,
    travelFee?: number
  ): { subject: string; html: string } {
    const isCreator = role === 'creator';
    const subject = isCreator
      ? `New Booking Request: ${eventTitle} (${bookingRef})`
      : `Your Booking Request Has Been Placed (${bookingRef})`;

    const html = wrapBrandEmail(
      subject,
      `
      <span class="badge badge-brand">Booking Request</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">${isCreator ? 'You have a new shoot request!' : 'Your reservation has been placed'}</h2>
      <p>${isCreator ? `Client <strong>${recipientName}</strong> has placed a booking reservation with your studio.` : `We've received your booking request for <strong>${eventTitle}</strong>.`}</p>
      <div class="card">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #736B63;">Booking Reference:</td>
            <td style="padding: 6px 0; font-weight: 800; font-family: monospace; color: #FF6E00;">${bookingRef}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #736B63;">Scheduled Date:</td>
            <td style="padding: 6px 0; font-weight: 700;">${eventDate} at ${startTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #736B63;">Event Venue:</td>
            <td style="padding: 6px 0; font-weight: 700;">${location}</td>
          </tr>
          ${travelDistanceKm !== undefined ? `
          <tr>
            <td style="padding: 6px 0; color: #736B63;">Travel Distance:</td>
            <td style="padding: 6px 0; font-weight: 700;">${travelDistanceKm} km ${travelFee ? `(Travel Fee: ₹${travelFee.toLocaleString('en-IN')})` : '(Included)'}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 1px solid #E8E1D6;">
            <td style="padding: 10px 0 0; color: #1A1816; font-weight: 800;">Total Quoted Price:</td>
            <td style="padding: 10px 0 0; font-weight: 900; font-size: 16px; color: #FF6E00;">₹${totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center;">
        <a href="${isCreator ? 'https://snapshoot.in/photographer/bookings' : 'https://snapshoot.in/customer/bookings'}" class="button">View Booking Details →</a>
      </div>
      `
    );
    return { subject, html };
  },

  bookingConfirmed(
    recipientName: string,
    bookingRef: string,
    eventTitle: string,
    eventDate: string,
    startTime: string,
    location: string,
    totalAmount: number
  ): { subject: string; html: string } {
    const subject = `Your Photography Booking Is Confirmed (${bookingRef})`;
    const html = wrapBrandEmail(
      'Booking Confirmed',
      `
      <span class="badge badge-success">Booking Confirmed</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">You're All Set, ${recipientName}!</h2>
      <p>Your booking for <strong>${eventTitle}</strong> is now confirmed. The agreed pricing is locked in platform escrow.</p>
      <div class="card">
        <p style="margin: 0 0 6px; font-weight: 800; font-family: monospace; color: #FF6E00;">REF: ${bookingRef}</p>
        <p style="margin: 0 0 4px;"><strong>Date:</strong> ${eventDate} at ${startTime}</p>
        <p style="margin: 0 0 4px;"><strong>Venue:</strong> ${location}</p>
        <p style="margin: 0;"><strong>Total Paid / Escrow Secured:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
      </div>
      <div style="text-align: center;">
        <a href="https://snapshoot.in/customer/bookings" class="button">View in Customer Dashboard →</a>
      </div>
      `
    );
    return { subject, html };
  },

  bookingReminder(
    recipientName: string,
    bookingRef: string,
    eventTitle: string,
    eventDate: string,
    startTime: string,
    location: string
  ): { subject: string; html: string } {
    const subject = `Reminder: Your Photography Session Is Coming Up (${bookingRef})`;
    const html = wrapBrandEmail(
      'Shoot Reminder',
      `
      <span class="badge badge-brand">Shoot Reminder</span>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 900;">Upcoming Shoot Reminder</h2>
      <p>Hello ${recipientName}, this is a friendly reminder that your photography session <strong>${eventTitle}</strong> is coming up soon!</p>
      <div class="card">
        <p style="margin: 0 0 6px; font-weight: 800; font-family: monospace; color: #FF6E00;">REF: ${bookingRef}</p>
        <p style="margin: 0 0 4px;"><strong>Date:</strong> ${eventDate}</p>
        <p style="margin: 0 0 4px;"><strong>Start Time:</strong> ${startTime}</p>
        <p style="margin: 0;"><strong>Venue Location:</strong> ${location}</p>
      </div>
      <p style="font-size: 13px; color: #736B63;">Please ensure venue access and gear readiness prior to shoot start time.</p>
      `
    );
    return { subject, html };
  },
};

/**
 * Dispatch an email notification and log delivery state in email_delivery_logs.
 * Works seamlessly in development, sandbox, and production environments.
 */
export async function sendPlatformEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
  const { to, subject, templateName, eventType, html, relatedEntityId, idempotencyKey } = options;

  const admin = getSupabaseAdminClient();

  // 1. Check idempotency if key provided (prevent duplicate sends within 15 mins)
  if (idempotencyKey && admin) {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: existing } = await admin
      .from('email_delivery_logs')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'sent')
      .gt('created_at', fifteenMinsAgo)
      .maybeSingle();

    if (existing) {
      return { success: true, logId: existing.id, skippedDuplicate: true };
    }
  }

  // 2. Insert initial pending delivery log
  let logId: string | undefined;
  if (admin) {
    try {
      const { data: logEntry } = await admin
        .from('email_delivery_logs')
        .insert({
          recipient_email: to.email,
          recipient_user_id: to.userId || null,
          template_name: templateName,
          subject,
          event_type: eventType,
          related_entity_id: relatedEntityId || null,
          idempotency_key: idempotencyKey || null,
          status: 'pending',
          retry_count: 0,
        })
        .select('id')
        .maybeSingle();

      if (logEntry) logId = logEntry.id;
    } catch (err) {
      console.warn('Could not record pending email log:', err);
    }
  }

  // 3. Dispatch Email via Configured Provider
  let isSent = false;
  let deliveryError: string | null = null;
  let messageId: string | undefined;

  const configured = isEmailConfigured();

  if (!configured) {
    deliveryError = 'Email service is not configured. SMTP credentials (GMAIL_USER & GMAIL_APP_PASSWORD) are missing on the server.';
    console.warn(`[EMAIL UNCONFIGURED] Attempted to send "${subject}" to ${to.email}, but no SMTP transport credentials exist in environment.`);
    
    // In development mode, display a helpful hint in server terminal
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[DEV EMAIL HINT] Set GMAIL_USER and GMAIL_APP_PASSWORD in apps/web/.env.local to enable live delivery to inboxes.`);
    }

    if (admin && logId) {
      try {
        await admin
          .from('email_delivery_logs')
          .update({
            status: 'failed',
            error_message: deliveryError,
          })
          .eq('id', logId);
      } catch (logErr) {
        console.warn('Could not update email log status:', logErr);
      }
    }

    return {
      success: false,
      logId,
      unconfigured: true,
      error: deliveryError,
    };
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    deliveryError = 'Could not initialize SMTP transport from provided configuration.';
    return {
      success: false,
      logId,
      error: deliveryError,
    };
  }

  try {
    const fromAddress = getSenderAddress();
    const mailOptions = {
      from: fromAddress,
      to: to.name ? `"${to.name}" <${to.email}>` : to.email,
      subject,
      html,
      text: options.text || subject,
    };

    console.log(`[EMAIL DISPATCH] Transmitting live email to ${to.email} ("${subject}") via SMTP...`);
    const sendResult = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL ACCEPTED] Delivery accepted by provider. MessageId: ${sendResult.messageId}`);
    
    isSent = true;
    messageId = sendResult.messageId;
  } catch (err: any) {
    deliveryError = err?.message || 'SMTP delivery failed.';
    console.error('[EMAIL SEND ERROR]', deliveryError);
  }

  // 4. Update delivery log with final status
  if (admin && logId) {
    try {
      await admin
        .from('email_delivery_logs')
        .update({
          status: isSent ? 'sent' : 'failed',
          error_message: deliveryError,
          sent_at: isSent ? new Date().toISOString() : null,
        })
        .eq('id', logId);
    } catch (updateErr) {
      console.warn('Could not update email log status:', updateErr);
    }
  }

  return {
    success: isSent,
    logId,
    messageId,
    error: deliveryError || undefined,
  };
}
