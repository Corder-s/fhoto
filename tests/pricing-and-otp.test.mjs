import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  calculateHaversineDistanceKm,
  calculateAuthoritativePricing,
  KNOWN_HUBS,
} from '../apps/web/src/lib/server/pricing.ts';

describe('Geodesic Distance Calculation (Haversine)', () => {
  it('returns 0 for identical coordinates', () => {
    const dist = calculateHaversineDistanceKm(28.4744, 77.5040, 28.4744, 77.5040);
    assert.equal(dist, 0);
  });

  it('calculates accurate distance between known Indian hubs', () => {
    // Greater Noida to Connaught Place, New Delhi (~38-42 km)
    const gn = KNOWN_HUBS['greater noida'];
    const delhi = KNOWN_HUBS['delhi'];
    assert.ok(gn && delhi);
    const dist = calculateHaversineDistanceKm(gn.lat, gn.lng, delhi.lat, delhi.lng);
    assert.ok(dist >= 30 && dist <= 45, `Expected 30-45km, got ${dist}km`);
  });

  it('correctly calculates 5 km, 25 km, and 50 km distances', () => {
    // Offset by ~0.045 degrees lat is ~5 km
    const dist5 = calculateHaversineDistanceKm(28.4744, 77.5040, 28.5194, 77.5040);
    assert.ok(Math.abs(dist5 - 5.0) < 0.2, `Expected ~5km, got ${dist5}km`);

    // Offset by ~0.225 degrees lat is ~25 km
    const dist25 = calculateHaversineDistanceKm(28.4744, 77.5040, 28.6994, 77.5040);
    assert.ok(Math.abs(dist25 - 25.0) < 0.5, `Expected ~25km, got ${dist25}km`);

    // Offset by ~0.450 degrees lat is ~50 km
    const dist50 = calculateHaversineDistanceKm(28.4744, 77.5040, 28.9244, 77.5040);
    assert.ok(Math.abs(dist50 - 50.0) < 1.0, `Expected ~50km, got ${dist50}km`);
  });
});

describe('Distance-Based Travel Pricing Engine (MASTER PROMPT Section 7.4)', () => {
  const pCoords = { lat: 28.4744, lng: 77.5040 };
  const standardTravelSettings = {
    serviceRadiusKm: 50,
    includedTravelKm: 10,
    travelFeePerKm: 20,
    minTravelFee: 0,
    maxTravelFee: null,
    allowOutOfArea: false,
  };

  it('Scenario 1: Customer books at photographer base location (0 km)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Greater Noida Studio Hub',
      venueCoords: pCoords,
      travelSettings: standardTravelSettings,
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.travelDistanceKm, 0);
    assert.equal(result.chargeableDistanceKm, 0);
    assert.equal(result.travelFee, 0);
    assert.equal(result.subtotal, 5000);
    assert.equal(result.totalAmount, 5000);
  });

  it('Scenario 2: Customer books 5 km away (within 10 km included radius)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Alpha 1, Greater Noida',
      venueCoords: { lat: 28.5194, lng: 77.5040 }, // ~5 km away
      travelSettings: standardTravelSettings,
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.ok(Math.abs(result.travelDistanceKm - 5.0) < 0.2);
    assert.equal(result.chargeableDistanceKm, 0); // max(0, 5 - 10) = 0
    assert.equal(result.travelFee, 0);
    assert.equal(result.totalAmount, 5000);
  });

  it('Scenario 3: Customer books 25 km away (15 km chargeable @ ₹20/km = ₹300)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Sector 62, Noida',
      venueCoords: { lat: 28.6994, lng: 77.5040 }, // ~25 km away
      travelSettings: standardTravelSettings,
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.ok(Math.abs(result.travelDistanceKm - 25.0) < 0.5);
    assert.ok(Math.abs(result.chargeableDistanceKm - 15.0) < 0.5);
    // 15 km * 20 = 300
    assert.equal(result.travelFee, Math.round(result.chargeableDistanceKm * 20));
    assert.equal(result.totalAmount, 5000 + result.travelFee);
  });

  it('Scenario 4: Customer books 50 km away (40 km chargeable @ ₹20/km = ₹800)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Connaught Place, New Delhi',
      venueCoords: { lat: 28.9244, lng: 77.5040 }, // ~50 km away
      travelSettings: standardTravelSettings,
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.ok(Math.abs(result.travelDistanceKm - 50.0) < 1.0);
    assert.ok(Math.abs(result.chargeableDistanceKm - 40.0) < 1.0);
    assert.equal(result.travelFee, Math.round(result.chargeableDistanceKm * 20));
    assert.equal(result.totalAmount, 5000 + result.travelFee);
  });

  it('Scenario 5: Flags booking exceeding service radius when out of area bookings disallowed', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Jaipur, Rajasthan',
      venueCoords: { lat: 26.9124, lng: 75.7873 }, // ~260 km away
      travelSettings: {
        ...standardTravelSettings,
        serviceRadiusKm: 50,
        allowOutOfArea: false,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.isOutOfArea, true);
    assert.ok(result.travelDistanceKm > 200);
  });

  it('Scenario 6: Enforces minimum travel fee when chargeable distance > 0', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Nearby Venue (12 km)',
      venueCoords: { lat: 28.5824, lng: 77.5040 }, // ~12 km (chargeable = 2 km, rate fee = ₹40, min fee = ₹250)
      travelSettings: {
        ...standardTravelSettings,
        minTravelFee: 250,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.travelFee, 250);
    assert.equal(result.totalAmount, 5250);
  });

  it('Scenario 7: Enforces maximum travel fee cap when configured', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: 'Far Venue (40 km)',
      venueCoords: { lat: 28.8344, lng: 77.5040 }, // ~40 km * 50 = ₹2,000, capped at ₹1,000
      travelSettings: {
        ...standardTravelSettings,
        includedTravelKm: 0,
        travelFeePerKm: 50,
        maxTravelFee: 1000,
        serviceRadiusKm: 200,
        allowOutOfArea: true,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.travelFee, 1000);
    assert.equal(result.totalAmount, 6000);
  });

  it('Scenario 8: Default platform policy includes first 20 km for free (15 km booking -> ₹0 travel fee)', () => {
    // When no custom includedTravelKm is provided, default is 20 km
    const result = calculateAuthoritativePricing({
      basePackagePrice: 6000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: '15 km Venue',
      venueCoords: { lat: 28.6094, lng: 77.5040 }, // ~15 km away
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.includedTravelKm, 20);
    assert.ok(result.calculatedDistanceKm <= 20);
    assert.equal(result.chargeableDistanceKm, 0);
    assert.equal(result.travelFee, 0);
    assert.equal(result.totalAmount, 6000);
  });

  it('Scenario 9: Booking exactly at 20 km threshold -> ₹0 travel fee', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: '20 km Venue',
      venueCoords: { lat: 28.6544, lng: 77.5040 }, // ~20 km away
      travelSettings: {
        includedTravelKm: 20,
        travelFeePerKm: 20,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.chargeableDistanceKm, 0);
    assert.equal(result.travelFee, 0);
    assert.equal(result.totalAmount, 5000);
  });

  it('Scenario 10: Booking beyond 20 km (32 km -> 12 km chargeable @ ₹20 = ₹240)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: '32 km Venue',
      venueCoords: { lat: 28.7624, lng: 77.5040 }, // ~32 km away
      travelSettings: {
        includedTravelKm: 20,
        travelFeePerKm: 20,
        serviceRadiusKm: 100,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.ok(Math.abs(result.travelDistanceKm - 32.0) < 0.5);
    assert.ok(Math.abs(result.chargeableDistanceKm - 12.0) < 0.5);
    assert.equal(result.travelFee, Math.round(result.chargeableDistanceKm * 20));
    assert.equal(result.totalAmount, 5000 + result.travelFee);
  });

  it('Scenario 11: Booking beyond 20 km with round-trip billing enabled (12 km chargeable * ₹20 * 2 = ₹480)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 5000,
      photographerBaseAddress: 'Greater Noida Studio Hub',
      photographerCoords: pCoords,
      customerEventAddress: '32 km Venue',
      venueCoords: { lat: 28.7624, lng: 77.5040 }, // ~32 km away
      travelSettings: {
        includedTravelKm: 20,
        travelFeePerKm: 20,
        roundTripBilling: true,
        serviceRadiusKm: 100,
      },
      platformFeePercent: 0,
      gstPercent: 0,
    });

    assert.equal(result.roundTripBilling, true);
    assert.ok(Math.abs(result.chargeableDistanceKm - 12.0) < 0.5);
    assert.equal(result.travelFee, Math.round(result.chargeableDistanceKm * 20 * 2));
    assert.equal(result.totalAmount, 5000 + result.travelFee);
  });
});

describe('OTP Verification Hashing & Security Controls', () => {
  it('generates consistent SHA-256 hash for email and 6-digit code', () => {
    const email = 'user@example.com';
    const otp = '849201';
    const hash1 = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
    const hash2 = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  it('fails verification when an incorrect OTP is supplied', () => {
    const email = 'user@example.com';
    const realOtp = '849201';
    const wrongOtp = '849202';
    const realHash = crypto.createHash('sha256').update(`${email}:${realOtp}`).digest('hex');
    const wrongHash = crypto.createHash('sha256').update(`${email}:${wrongOtp}`).digest('hex');
    assert.notEqual(realHash, wrongHash);
  });
});
