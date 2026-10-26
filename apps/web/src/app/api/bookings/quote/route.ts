import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  calculateAuthoritativePricing,
  DEFAULT_TRAVEL_SETTINGS,
  KNOWN_HUBS,
  resolveCoordinatesFromText,
} from '@/lib/server/pricing';
import { isUuid } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/quote
 *
 * Computes an authoritative live distance and price breakdown preview
 * based on the photographer's configured travel rules and the event location.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { creatorId, serviceId, eventLocation, locationLatitude, locationLongitude } = body;

  if (!creatorId) {
    return NextResponse.json({ error: 'creatorId is required.' }, { status: 400 });
  }
  if (!eventLocation || typeof eventLocation !== 'string' || !eventLocation.trim()) {
    return NextResponse.json({ error: 'eventLocation is required.' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Database service is unavailable.' }, { status: 503 });
  }

  // 1. Fetch Creator and Travel Settings
  let creatorQuery = admin
    .from('creator_profiles')
    .select(`
      id,
      professional_name,
      city,
      state,
      service_radius,
      base_address,
      base_latitude,
      base_longitude,
      included_travel_km,
      travel_fee_per_km,
      min_travel_fee,
      max_travel_fee,
      allow_out_of_area
    `);

  if (isUuid(creatorId)) {
    creatorQuery = creatorQuery.or(`id.eq.${creatorId},user_id.eq.${creatorId}`);
  } else {
    creatorQuery = creatorQuery.ilike('professional_name', `%${creatorId}%`);
  }

  const { data: creator, error: creatorErr } = await creatorQuery.limit(1).maybeSingle();

  if (creatorErr || !creator) {
    return NextResponse.json({ error: 'Photographer not found.' }, { status: 404 });
  }

  // 2. Fetch Selected Service Package Price
  let basePackagePrice = 2499;
  if (serviceId && isUuid(serviceId)) {
    const { data: service } = await admin
      .from('creator_services')
      .select('id, base_price, is_active')
      .eq('id', serviceId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (service && service.base_price) {
      basePackagePrice = Number(service.base_price);
    }
  } else if (typeof body.basePackagePrice === 'number' && body.basePackagePrice > 0) {
    basePackagePrice = body.basePackagePrice;
  }

  // 3. Resolve Photographer Base Coordinates
  let photogLat = creator.base_latitude !== null ? Number(creator.base_latitude) : null;
  let photogLng = creator.base_longitude !== null ? Number(creator.base_longitude) : null;

  if (photogLat === null || photogLng === null || Number.isNaN(photogLat) || Number.isNaN(photogLng)) {
    const hubCoords = resolveCoordinatesFromText(creator.base_address || creator.city || 'Delhi NCR');
    if (hubCoords) {
      photogLat = hubCoords.lat;
      photogLng = hubCoords.lng;
    } else {
      photogLat = KNOWN_HUBS['delhi'].lat;
      photogLng = KNOWN_HUBS['delhi'].lng;
    }
  }

  // 4. Resolve Venue Coordinates
  let venueLat: number | null = null;
  let venueLng: number | null = null;

  if (
    typeof locationLatitude === 'number' &&
    typeof locationLongitude === 'number' &&
    !Number.isNaN(locationLatitude) &&
    !Number.isNaN(locationLongitude)
  ) {
    venueLat = locationLatitude;
    venueLng = locationLongitude;
  } else {
    // Try text coordinate resolution
    const resolvedVenue = resolveCoordinatesFromText(eventLocation);
    if (resolvedVenue) {
      venueLat = resolvedVenue.lat;
      venueLng = resolvedVenue.lng;
    } else {
      // Default to photographer base coords (0 km travel) if text cannot be geocoded
      venueLat = photogLat;
      venueLng = photogLng;
    }
  }

  // 5. Query Active Platform Distance Settings
  const { data: platformDistance } = await admin
    .from('platform_distance_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const freeKm = platformDistance ? Number(platformDistance.free_travel_km) : DEFAULT_TRAVEL_SETTINGS.includedTravelKm;
  const platformRate = platformDistance ? Number(platformDistance.travel_fee_per_km) : DEFAULT_TRAVEL_SETTINGS.travelFeePerKm;
  const allowOverride = platformDistance ? platformDistance.allow_photographer_override : true;
  const roundTrip = platformDistance ? Boolean(platformDistance.round_trip_billing) : false;

  const effectiveTravelRate =
    allowOverride && creator.travel_fee_per_km !== null && Number(creator.travel_fee_per_km) > 0
      ? Number(creator.travel_fee_per_km)
      : platformRate;

  // 6. Compute Authoritative Pricing Snapshot
  const pricingSnapshot = calculateAuthoritativePricing({
    basePackagePrice,
    photographerCoords: { lat: photogLat, lng: photogLng },
    venueCoords: { lat: venueLat, lng: venueLng },
    photographerBaseAddress: creator.base_address || creator.city || 'Delhi NCR',
    customerEventAddress: eventLocation.trim(),
    travelSettings: {
      includedTravelKm: freeKm,
      travelFeePerKm: effectiveTravelRate,
      roundTripBilling: roundTrip,
      minTravelFee: creator.min_travel_fee !== null ? Number(creator.min_travel_fee) : DEFAULT_TRAVEL_SETTINGS.minTravelFee,
      maxTravelFee: creator.max_travel_fee !== null ? Number(creator.max_travel_fee) : null,
      serviceRadiusKm: creator.service_radius || DEFAULT_TRAVEL_SETTINGS.serviceRadiusKm,
      allowOutOfArea: creator.allow_out_of_area ?? true,
    },
  });

  return NextResponse.json({
    success: true,
    creator: {
      id: creator.id,
      name: creator.professional_name,
      baseAddress: creator.base_address || creator.city,
      serviceRadiusKm: creator.service_radius,
    },
    quote: pricingSnapshot,
  });
}
