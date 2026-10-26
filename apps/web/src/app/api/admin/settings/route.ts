import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Reads platform distance, commission, and operational policy settings.
 */
export async function GET() {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_platform_settings' });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  try {
    const { data: distanceSettings, error } = await admin
      .from('platform_distance_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('[admin/settings] Could not read platform_distance_settings:', error.message);
    }

    const fallbackDistanceSettings = {
      id: 1,
      free_travel_km: 20.0,
      travel_fee_per_km: 20.0,
      distance_method: 'haversine',
      round_trip_billing: false,
      min_travel_fee: 0.0,
      max_travel_fee: null,
      allow_photographer_override: true,
      updated_at: new Date().toISOString(),
    };

    const paymentSecret = process.env.PAYMENT_PROVIDER_SECRET_KEY;
    const isGatewayLive = Boolean(paymentSecret && !paymentSecret.includes('placeholder'));

    return NextResponse.json({
      success: true,
      settings: {
        distance: distanceSettings || fallbackDistanceSettings,
        commission: {
          model: 'percentage_of_subtotal',
          defaultTakeRatePercent: 10,
          version: '2026.1',
          currency: 'INR',
        },
        gateway: {
          mode: isGatewayLive ? 'live' : 'sandbox',
          configured: isGatewayLive,
          provider: isGatewayLive ? 'razorpay' : 'dev_sandbox',
        },
        notifications: {
          emailProvider: process.env.RESEND_API_KEY ? 'resend' : 'development_logger',
          smsProvider: 'unconfigured',
          webhooksEnabled: true,
        },
      },
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Failed to read platform settings.');
  }
}

/**
 * PUT /api/admin/settings
 * Updates platform distance settings and records an audit log entry.
 */
export async function PUT(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_platform_settings' });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const { distance } = body;
  if (!distance) return jsonError(400, 'Missing distance configuration.');

  const freeTravelKm = Number(distance.free_travel_km);
  const travelFeePerKm = Number(distance.travel_fee_per_km);
  const distanceMethod = distance.distance_method === 'driving' ? 'driving' : 'haversine';
  const roundTripBilling = Boolean(distance.round_trip_billing);
  const minTravelFee = distance.min_travel_fee != null ? Number(distance.min_travel_fee) : 0;
  const maxTravelFee = distance.max_travel_fee != null && distance.max_travel_fee !== '' ? Number(distance.max_travel_fee) : null;
  const allowPhotographerOverride = distance.allow_photographer_override !== false;

  // Strict server-side validation
  if (isNaN(freeTravelKm) || freeTravelKm < 0 || freeTravelKm > 500) {
    return jsonError(400, 'Free travel distance must be a valid number between 0 and 500 km.');
  }
  if (isNaN(travelFeePerKm) || travelFeePerKm < 0 || travelFeePerKm > 2000) {
    return jsonError(400, 'Per-kilometer travel fee must be a valid number between ₹0 and ₹2000.');
  }
  if (isNaN(minTravelFee) || minTravelFee < 0) {
    return jsonError(400, 'Minimum travel fee cannot be negative.');
  }
  if (maxTravelFee !== null && (isNaN(maxTravelFee) || maxTravelFee < minTravelFee)) {
    return jsonError(400, 'Maximum travel fee must be greater than or equal to minimum travel fee.');
  }

  try {
    const updatePayload = {
      free_travel_km: freeTravelKm,
      travel_fee_per_km: travelFeePerKm,
      distance_method: distanceMethod,
      round_trip_billing: roundTripBilling,
      min_travel_fee: minTravelFee,
      max_travel_fee: maxTravelFee,
      allow_photographer_override: allowPhotographerOverride,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await admin
      .from('platform_distance_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select('*')
      .maybeSingle();

    if (error) {
      return jsonError(500, `Failed to update distance settings: ${error.message}`);
    }

    // Record audit log entry in system_logs
    try {
      await admin.from('system_logs').insert({
        category: 'SYSTEM',
        level: 'INFO',
        action: 'UPDATE_DISTANCE_POLICY',
        actor: user.id,
        actor_email: user.email,
        target: 'platform_distance_settings',
        details: `Updated distance policy: free ${freeTravelKm} km, ₹${travelFeePerKm}/km, roundTrip: ${roundTripBilling}, method: ${distanceMethod}`,
        metadata: updatePayload,
      });
    } catch {
      // Audit log failure should not fail the configuration transaction
    }

    return NextResponse.json({
      success: true,
      message: 'Distance pricing settings saved successfully.',
      settings: updated,
    });
  } catch (err: any) {
    return jsonError(500, err?.message || 'Failed to save settings.');
  }
}
