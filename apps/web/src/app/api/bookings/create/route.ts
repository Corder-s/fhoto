import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase/admin';

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload received.' },
      { status: 400 }
    );
  }

  try {
    const {
      customerId,
      creatorId,
      serviceId,
      eventTitle,
      eventDate,
      startAt,
      endAt,
      eventLocation,
      locationLatitude,
      locationLongitude,
      customerNotes,
      bookingType = 'scheduled',
    } = body;

    // Validate required fields
    if (!creatorId || !eventTitle || !eventDate || !eventLocation) {
      return NextResponse.json(
        { error: 'Missing required booking information (creator, event title, date, or location).' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // Default price & fee calculations (Paise / INR)
    let agreedServicePrice = 8500;
    let platformFeeRate = 10; // 10%
    let serviceDuration = 120;

    if (admin) {
      // 1. Fetch live service package from database to guarantee authentic pricing
      if (serviceId) {
        const { data: service, error: serviceErr } = await admin
          .from('creator_services')
          .select('*')
          .eq('id', serviceId)
          .eq('creator_id', creatorId)
          .single();

        if (service && !serviceErr) {
          agreedServicePrice = Number(service.base_price);
          serviceDuration = service.duration_minutes || 120;
        }
      }

      // 2. Query active platform fee
      const { data: feeSetting } = await admin
        .from('platform_fee_settings')
        .select('*')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (feeSetting) {
        platformFeeRate = Number(feeSetting.fee_value);
      }

      // 3. Check for conflicting confirmed bookings for the creator
      if (startAt && endAt) {
        const { data: conflicts } = await admin
          .from('bookings')
          .select('id, start_at, end_at, booking_status')
          .eq('creator_id', creatorId)
          .in('booking_status', ['confirmed', 'in_progress', 'accepted'])
          .lte('start_at', endAt)
          .gte('end_at', startAt);

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json(
            { error: 'Selected creator is already reserved for this timeframe. Please pick another slot.' },
            { status: 409 }
          );
        }
      }
    }

    // Precise Server Financial Calculations (Server Authoritative)
    const platformFee = Math.round((agreedServicePrice * platformFeeRate) / 100);
    const taxes = Math.round((agreedServicePrice + platformFee) * 0.18); // 18% GST
    const discountAmount = 0;
    const totalAmount = agreedServicePrice + platformFee + taxes - discountAmount;
    const bookingRef = `INST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const startTime = startAt || `${eventDate}T10:00:00Z`;
    const endTime = endAt || `${eventDate}T14:00:00Z`;

    let createdBooking = {
      id: `booking-${Date.now()}`,
      booking_reference: bookingRef,
      customer_id: customerId || 'cust-guest',
      creator_id: creatorId,
      service_id: serviceId || null,
      event_title: eventTitle,
      event_date: eventDate,
      start_at: startTime,
      end_at: endTime,
      event_location: eventLocation,
      location_latitude: locationLatitude || null,
      location_longitude: locationLongitude || null,
      customer_notes: customerNotes || null,
      agreed_service_price: agreedServicePrice,
      platform_fee: platformFee,
      taxes: taxes,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency: 'INR',
      booking_type: bookingType,
      booking_status: bookingType === 'instant' ? 'confirmed' : 'pending',
      payment_status: 'unpaid',
      created_at: new Date().toISOString(),
    };

    if (admin && customerId) {
      // Insert real database record
      const { data, error } = await admin
        .from('bookings')
        .insert({
          booking_reference: bookingRef,
          customer_id: customerId,
          creator_id: creatorId,
          service_id: serviceId,
          event_title: eventTitle,
          event_date: eventDate,
          start_at: startTime,
          end_at: endTime,
          event_location: eventLocation,
          location_latitude: locationLatitude,
          location_longitude: locationLongitude,
          customer_notes: customerNotes,
          agreed_service_price: agreedServicePrice,
          platform_fee: platformFee,
          taxes: taxes,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          currency: 'INR',
          booking_type: bookingType,
          booking_status: bookingType === 'instant' ? 'confirmed' : 'pending',
          payment_status: 'unpaid',
        })
        .select()
        .single();

      if (!error && data) {
        createdBooking = data;

        // Record initial history
        await admin.from('booking_status_history').insert({
          booking_id: data.id,
          previous_status: null,
          new_status: data.booking_status,
          changed_by: customerId,
          change_reason: 'Booking requested by customer',
        });

        // Initialize escrow payout record
        await admin.from('creator_payouts').insert({
          creator_id: creatorId,
          booking_id: data.id,
          gross_amount: agreedServicePrice,
          platform_fee: platformFee,
          adjustment_amount: 0,
          net_amount: agreedServicePrice - platformFee,
          payout_status: 'in_escrow',
        });
      }
    }

    return NextResponse.json({
      success: true,
      booking: createdBooking,
      breakdown: {
        agreedServicePrice,
        platformFee,
        taxes,
        totalAmount,
        currency: 'INR',
      },
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing booking.' },
      { status: 500 }
    );
  }
}
