/**
 * Distance Calculation and Distance-Based Pricing Engine
 *
 * Implements authoritative geodesic (Haversine) distance calculation,
 * venue location resolution, and transparent travel-pricing breakdown.
 */

export interface TravelPricingSettings {
  includedTravelKm: number;
  travelFeePerKm: number;
  minTravelFee: number;
  maxTravelFee: number | null;
  serviceRadiusKm: number;
  allowOutOfArea: boolean;
  roundTripBilling?: boolean;
}

export interface PricingBreakdownSnapshot {
  baseServicePrice: number;
  calculatedDistanceKm: number;
  travelDistanceKm: number;
  distanceMethod: 'haversine_straight_line' | 'road';
  includedTravelKm: number;
  chargeableDistanceKm: number;
  travelRatePerKm: number;
  roundTripBilling?: boolean;
  travelFee: number;
  subtotal: number;
  platformFee: number;
  platformFeePercent: number;
  taxes: number;
  taxPercent: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  isOutOfArea: boolean;
  photographerBaseAddress: string;
  customerEventAddress: string;
  warnings?: string[];
}

export const DEFAULT_TRAVEL_SETTINGS: TravelPricingSettings = {
  includedTravelKm: 20,
  travelFeePerKm: 20,
  minTravelFee: 0,
  maxTravelFee: null,
  serviceRadiusKm: 50,
  allowOutOfArea: true,
  roundTripBilling: false,
};

/**
 * Standard Indian City Hub Coordinates for fallback and base positioning
 */
export const KNOWN_HUBS: Record<string, { lat: number; lng: number }> = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'delhi ncr': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'greater noida': { lat: 28.4744, lng: 77.5040 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'faridabad': { lat: 28.4089, lng: 77.3178 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
};

/**
 * Calculates geodesic (great-circle) distance between two lat/lng points in kilometres
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g. 14.8 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Resolves coordinates for an address query using known hubs dictionary
 * or returns null if unresolved.
 */
export function resolveCoordinatesFromText(text: string): { lat: number; lng: number } | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const [key, coords] of Object.entries(KNOWN_HUBS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }

  return null;
}

export interface CalculatePricingInput {
  basePackagePrice: number;
  photographerCoords: { lat: number; lng: number };
  venueCoords: { lat: number; lng: number };
  photographerBaseAddress: string;
  customerEventAddress: string;
  travelSettings?: Partial<TravelPricingSettings>;
  platformFeePercent?: number;
  gstPercent?: number;
}

/**
 * Authoritative Distance-Based Pricing Engine
 *
 * Formula:
 * Chargeable Distance = max(0, Calculated Travel Distance - Included Travel Distance)
 * Travel Fee = max(Minimum Travel Fee, Chargeable Distance × Travel Rate Per KM)
 * Subtotal = Base Service Price + Travel Fee
 * Platform Fee = Subtotal × Platform Rate %
 * Taxes = (Subtotal + Platform Fee) × GST %
 * Final Price = Subtotal + Platform Fee + Taxes - Discounts
 */
export function calculateAuthoritativePricing(input: CalculatePricingInput): PricingBreakdownSnapshot {
  const {
    basePackagePrice,
    photographerCoords,
    venueCoords,
    photographerBaseAddress,
    customerEventAddress,
    travelSettings: customSettings,
    platformFeePercent = 10,
    gstPercent = 18,
  } = input;

  const settings: TravelPricingSettings = {
    ...DEFAULT_TRAVEL_SETTINGS,
    ...(customSettings || {}),
  };

  const pCoords =
    photographerCoords ||
    (photographerBaseAddress ? resolveCoordinatesFromText(photographerBaseAddress) : null) || {
      lat: 28.4744,
      lng: 77.504,
    };

  const vCoords =
    venueCoords ||
    (customerEventAddress ? resolveCoordinatesFromText(customerEventAddress) : null) || {
      lat: 28.4744,
      lng: 77.504,
    };

  const calculatedDistanceKm = calculateHaversineDistanceKm(
    pCoords.lat,
    pCoords.lng,
    vCoords.lat,
    vCoords.lng
  );

  const includedTravelKm = Math.max(0, settings.includedTravelKm);
  const chargeableDistanceKm = Math.max(0, Math.round((calculatedDistanceKm - includedTravelKm) * 10) / 10);
  const travelRatePerKm = Math.max(0, settings.travelFeePerKm);
  const isRoundTrip = Boolean(settings.roundTripBilling);

  let rawTravelFee = Math.round(chargeableDistanceKm * travelRatePerKm * (isRoundTrip ? 2 : 1));
  let travelFee = Math.max(settings.minTravelFee, rawTravelFee);

  if (settings.maxTravelFee !== null && settings.maxTravelFee > 0 && travelFee > settings.maxTravelFee) {
    travelFee = settings.maxTravelFee;
  }

  const isOutOfArea = calculatedDistanceKm > settings.serviceRadiusKm;
  const warnings: string[] = [];
  if (isOutOfArea) {
    warnings.push(`Venue location is ${calculatedDistanceKm} km away, which exceeds the photographer's standard service radius of ${settings.serviceRadiusKm} km.`);
  }

  const subtotal = basePackagePrice + travelFee;
  const platformFee = Math.round((subtotal * platformFeePercent) / 100);
  const taxes = Math.round((subtotal + platformFee) * (gstPercent / 100));
  const discountAmount = 0;
  const totalAmount = subtotal + platformFee + taxes - discountAmount;

  return {
    baseServicePrice: basePackagePrice,
    calculatedDistanceKm,
    travelDistanceKm: calculatedDistanceKm,
    distanceMethod: 'haversine_straight_line',
    includedTravelKm,
    chargeableDistanceKm,
    travelRatePerKm,
    roundTripBilling: isRoundTrip,
    travelFee,
    subtotal,
    platformFee,
    platformFeePercent,
    taxes,
    taxPercent: gstPercent,
    discountAmount,
    totalAmount,
    currency: 'INR',
    isOutOfArea,
    photographerBaseAddress,
    customerEventAddress,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
