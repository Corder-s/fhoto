import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  calculateHaversineDistanceKm,
  calculateAuthoritativePricing,
  KNOWN_HUBS,
} from '../apps/web/src/lib/server/pricing.ts';
import {
  createGatewayOrder,
  verifyPaymentSignature,
  generateSandboxSignature,
  verifyWebhookSignature,
} from '../apps/web/src/lib/server/payment.ts';

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

  it('Scenario 12: Duration scaling (8 Hours on ₹1,000 2-hour base package -> ₹4,000 subtotal)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 1000,
      durationHours: 8,
      serviceBaseHours: 2,
      photographerBaseAddress: 'Delhi NCR',
      photographerCoords: pCoords,
      customerEventAddress: 'Delhi NCR',
      venueCoords: pCoords, // 0 km travel
      platformFeePercent: 10,
      gstPercent: 18,
    });

    assert.equal(result.durationHours, 8);
    assert.equal(result.serviceBaseHours, 2);
    assert.equal(result.serviceSubtotal, 4000); // 1000 * (8 / 2) = 4000
    assert.equal(result.travelFee, 0);
    assert.equal(result.platformFee, 400); // 10% of 4000
    assert.equal(result.taxes, 792); // 18% of (4000 + 400)
    assert.equal(result.totalAmount, 5192); // 4000 + 400 + 792
    assert.equal(result.photographerEarnings, 3600); // 4000 - 400
  });

  it('Scenario 13: Exact bug reproduction (2 Hours @ ₹1,000 -> ₹1,298 total)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 1000,
      durationHours: 2,
      serviceBaseHours: 2,
      photographerBaseAddress: 'Delhi NCR',
      photographerCoords: pCoords,
      customerEventAddress: 'Delhi NCR',
      venueCoords: pCoords,
      platformFeePercent: 10,
      gstPercent: 18,
    });

    assert.equal(result.serviceSubtotal, 1000);
    assert.equal(result.platformFee, 100);
    assert.equal(result.taxes, 198);
    assert.equal(result.totalAmount, 1298); // Matches the ₹1,298 shown in customer dashboard card
  });

  it('Scenario 14: Exact bug reproduction (2 Hours @ ₹2,000 -> ₹2,596 total)', () => {
    const result = calculateAuthoritativePricing({
      basePackagePrice: 2000,
      durationHours: 2,
      serviceBaseHours: 2,
      photographerBaseAddress: 'Delhi NCR',
      photographerCoords: pCoords,
      customerEventAddress: 'Delhi NCR',
      venueCoords: pCoords,
      platformFeePercent: 10,
      gstPercent: 18,
    });

    assert.equal(result.serviceSubtotal, 2000);
    assert.equal(result.platformFee, 200);
    assert.equal(result.taxes, 396);
    assert.equal(result.totalAmount, 2596); // Matches the ₹2,596 booking in recording
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

describe('Razorpay Standard Payment Gateway & Webhook Signature Verification', () => {
  it('creates development sandbox order when live credentials are unset', async () => {
    const order = await createGatewayOrder({
      amountInPaise: 519200,
      currency: 'INR',
      receipt: 'rcpt_TEST_BK',
      notes: { booking_id: 'test-booking-id' },
    });

    assert.ok(order.orderId.startsWith('order_dev_'));
    assert.equal(order.amount, 519200);
    assert.equal(order.currency, 'INR');
    assert.equal(order.isSandbox, true);
    assert.equal(order.provider, 'dev_sandbox');
  });

  it('generates and validates sandbox payment signature', () => {
    const orderId = 'order_dev_1729000000_abc123';
    const paymentId = 'pay_dev_1729000000_xyz789';
    const sig = generateSandboxSignature(orderId, paymentId);

    const verified = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: sig,
    });
    assert.equal(verified.isValid, true);
  });

  it('rejects tampered sandbox signature or mismatched orderId', () => {
    const orderId = 'order_dev_1729000000_abc123';
    const paymentId = 'pay_dev_1729000000_xyz789';
    const sig = generateSandboxSignature(orderId, paymentId);

    // Altered payment ID
    const badVerify = verifyPaymentSignature({
      orderId,
      paymentId: 'pay_dev_1729000000_hacked',
      signature: sig,
    });
    assert.equal(badVerify.isValid, false);

    // Altered signature
    const badSigVerify = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: 'invalid_tampered_signature_123',
    });
    assert.equal(badSigVerify.isValid, false);
  });

  it('verifies Razorpay HMAC SHA-256 signature when credentials are configured', () => {
    const prevKeyId = process.env.RAZORPAY_KEY_ID;
    const prevKeySecret = process.env.RAZORPAY_KEY_SECRET;

    try {
      const testSecret = 'test_secret_for_unit_tests_abcdef123';
      process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key';
      process.env.RAZORPAY_KEY_SECRET = testSecret;

      const orderId = 'order_live_998877';
      const paymentId = 'pay_live_665544';
      const expectedSig = crypto
        .createHmac('sha256', testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const result = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: expectedSig,
      });

      assert.equal(result.isValid, true);

      // Mismatch test
      const tamperedResult = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: 'wrong_signature_value',
      });
      assert.equal(tamperedResult.isValid, false);
      assert.ok(tamperedResult.error?.includes('mismatch'));
    } finally {
      process.env.RAZORPAY_KEY_ID = prevKeyId;
      process.env.RAZORPAY_KEY_SECRET = prevKeySecret;
    }
  });

  it('validates webhook HMAC signature against webhook secret', () => {
    const prevWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    try {
      const webhookSecret = 'whsec_test_secret_778899';
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_live_12345',
              order_id: 'order_live_67890',
              amount: 519200,
            },
          },
        },
      });

      const validSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      assert.equal(verifyWebhookSignature(payload, validSig), true);
      assert.equal(verifyWebhookSignature(payload, 'wrong_signature'), false);
      assert.equal(verifyWebhookSignature(payload, null), false);
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = prevWebhookSecret;
    }
  });
});
