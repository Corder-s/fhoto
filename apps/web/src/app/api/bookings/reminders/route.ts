import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { EmailTemplates, sendPlatformEmail } from '@/lib/server/email';
import { createInAppNotification } from '@/lib/server/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/reminders
 *
 * Scans upcoming confirmed bookings occurring in the next 24-48 hours
 * and sends reminder emails and in-app alerts to both customer and photographer.
 * Idempotency keys prevent duplicate reminders.
 */
export async function POST(req: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Database service is unavailable.' }, { status: 503 });
  }

  // Window: Shoots scheduled between now and 48 hours in the future
  const now = new Date();
  const futureWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: upcomingBookings, error } = await admin
    .from('bookings')
    .select(`
      id,
      booking_reference,
      event_title,
      event_date,
      start_at,
      event_location,
      booking_status,
      customer_id,
      creator_id,
      customer:profiles!bookings_customer_id_fkey(id, full_name, email),
      creator:creator_profiles!bookings_creator_id_fkey(id, professional_name, user_id, user:profiles!creator_profiles_user_id_fkey(id, full_name, email))
    `)
    .in('booking_status', ['confirmed', 'accepted'])
    .gte('start_at', now.toISOString())
    .lte('start_at', futureWindow.toISOString());

  if (error) {
    console.error('Error fetching upcoming bookings for reminders:', error.message);
    return NextResponse.json({ error: 'Could not fetch upcoming bookings.' }, { status: 500 });
  }

  let processedCount = 0;
  let sentCount = 0;

  for (const b of upcomingBookings || []) {
    processedCount++;
    const bookingRef = b.booking_reference;
    const dateFormatted = b.event_date;
    const timeFormatted = new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Remind Customer
    const customer = (b as any).customer;
    if (customer?.email) {
      const emailTemplate = EmailTemplates.bookingReminder(
        customer.full_name || 'Valued Client',
        bookingRef,
        b.event_title,
        dateFormatted,
        timeFormatted,
        b.event_location
      );

      const customerRes = await sendPlatformEmail({
        to: { email: customer.email, name: customer.full_name, userId: customer.id },
        subject: emailTemplate.subject,
        templateName: 'booking_reminder_customer',
        eventType: 'booking.reminder',
        html: emailTemplate.html,
        relatedEntityId: b.id,
        idempotencyKey: `remind_cust_${b.id}_${dateFormatted}`,
      });

      if (customerRes.success && !customerRes.skippedDuplicate) {
        sentCount++;
        await createInAppNotification({
          userId: customer.id,
          type: 'booking_reminder',
          title: 'Upcoming Shoot Reminder',
          body: `Your shoot for "${b.event_title}" is coming up on ${dateFormatted} at ${timeFormatted}.`,
          relatedBookingId: b.id,
          actionUrl: '/customer/bookings',
        });
      }
    }

    // 2. Remind Photographer
    const creatorUser = (b as any).creator?.user;
    if (creatorUser?.email) {
      const emailTemplate = EmailTemplates.bookingReminder(
        (b as any).creator?.professional_name || creatorUser.full_name || 'Creator',
        bookingRef,
        b.event_title,
        dateFormatted,
        timeFormatted,
        b.event_location
      );

      const creatorRes = await sendPlatformEmail({
        to: { email: creatorUser.email, name: creatorUser.full_name, userId: creatorUser.id },
        subject: emailTemplate.subject,
        templateName: 'booking_reminder_creator',
        eventType: 'booking.reminder',
        html: emailTemplate.html,
        relatedEntityId: b.id,
        idempotencyKey: `remind_photog_${b.id}_${dateFormatted}`,
      });

      if (creatorRes.success && !creatorRes.skippedDuplicate) {
        sentCount++;
        await createInAppNotification({
          userId: creatorUser.id,
          type: 'booking_reminder',
          title: 'Upcoming Shoot Reminder',
          body: `You have an upcoming booking for "${b.event_title}" on ${dateFormatted} at ${timeFormatted}.`,
          relatedBookingId: b.id,
          actionUrl: '/photographer/bookings',
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    processedBookings: processedCount,
    dispatchedReminders: sentCount,
    message: `Processed ${processedCount} upcoming bookings. Dispatched ${sentCount} reminders.`,
  });
}
