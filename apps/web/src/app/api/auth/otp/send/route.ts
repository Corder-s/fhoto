import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { cleanText } from '@/lib/server/policy';
import { sendPlatformEmail, EmailTemplates } from '@/lib/server/email';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/otp/send
 *
 * Sends a cryptographically random 6-digit OTP code to the requested email.
 * Applies strict cooldown (60s), hourly rate limiting, and SHA-256 storage.
 * Never leaks account existence or OTP values in responses.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const rawEmail = cleanText(body.email, 254);
  const name = cleanText(body.name, 120);
  const purpose = cleanText(body.purpose, 30) || 'login';

  if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: 'Authentication service is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  const now = new Date();
  const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // 1. Check 60-second cooldown
  const { data: recentOtps } = await admin
    .from('auth_email_otps')
    .select('created_at')
    .eq('email', normalizedEmail)
    .gt('created_at', sixtySecondsAgo)
    .limit(1);

  if (recentOtps && recentOtps.length > 0) {
    return NextResponse.json(
      { error: 'Please wait 60 seconds before requesting another verification code.' },
      { status: 429 }
    );
  }

  // 2. Check 1-hour rate limit (max 5 OTPs per hour per email)
  const { data: hourlyOtps } = await admin
    .from('auth_email_otps')
    .select('id')
    .eq('email', normalizedEmail)
    .gt('created_at', oneHourAgo);

  if (hourlyOtps && hourlyOtps.length >= 5) {
    return NextResponse.json(
      { error: 'Too many verification requests. Please try again after an hour.' },
      { status: 429 }
    );
  }

  // 3. Generate random 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto
    .createHash('sha256')
    .update(`${normalizedEmail}:${otpCode}`)
    .digest('hex');

  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // 4. Save hashed record
  const { error: insertErr } = await admin.from('auth_email_otps').insert({
    email: normalizedEmail,
    otp_code_hash: otpHash,
    purpose,
    attempts: 0,
    max_attempts: 5,
    expires_at: expiresAt,
  });

  if (insertErr) {
    console.error('Failed to record auth OTP:', insertErr.message || insertErr);
    return NextResponse.json(
      { error: insertErr.message || 'Could not generate verification code. Please try again.' },
      { status: 500 }
    );
  }

  // 5. Send Email via Transactional Email Service
  const template = EmailTemplates.authOtp(name || normalizedEmail.split('@')[0], otpCode, 10);
  try {
    await sendPlatformEmail({
      to: { email: normalizedEmail, name: name || undefined },
      subject: template.subject,
      templateName: 'auth_otp',
      eventType: 'auth.otp_requested',
      html: template.html,
      text: `Your SnapShoot verification code is: ${otpCode}. It expires in 10 minutes.`,
    });
  } catch (emailErr) {
    console.error('Error dispatching OTP email:', emailErr);
    // Don't crash auth if email fails temporarily; sandbox logger handled it
  }

  return NextResponse.json({
    success: true,
    message: 'A 6-digit verification code has been sent to your email address.',
    cooldownSeconds: 60,
  });
}
