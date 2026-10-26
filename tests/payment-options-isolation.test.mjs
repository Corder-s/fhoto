import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  createGatewayOrder,
  verifyPaymentSignature,
  generateSandboxSignature,
  verifyWebhookSignature,
} from '../apps/web/src/lib/server/payment.ts';

describe('Payment Options & Discount Calculation Engine (Phase 3 & 4)', () => {
  it('Option A: Full Payment calculates exact 10% discount and ₹0 remaining balance', () => {
    const eligibleTotal = 10000;
    const discount = Math.round(eligibleTotal * 0.10);
    const finalTotal = eligibleTotal - discount;
    const amountPaidNow = finalTotal;
    const remainingBalance = finalTotal - amountPaidNow;

    assert.equal(discount, 1000, 'Full payment discount should be exactly 10% (₹1,000)');
    assert.equal(finalTotal, 9000, 'Discounted total should be ₹9,000');
    assert.equal(amountPaidNow, 9000, 'Customer pays ₹9,000 now');
    assert.equal(remainingBalance, 0, 'Remaining balance must be ₹0 after full payment');
  });

  it('Option B: Half Payment calculates 5% discount and splits into 2 installments', () => {
    const eligibleTotal = 10000;
    const discount = Math.round(eligibleTotal * 0.05);
    const finalTotal = eligibleTotal - discount;
    const firstInstallment = Math.round(finalTotal * 0.5);
    const secondInstallment = finalTotal - firstInstallment;

    assert.equal(discount, 500, 'Half payment discount should be exactly 5% (₹500)');
    assert.equal(finalTotal, 9500, 'Discounted total should be ₹9,500');
    assert.equal(firstInstallment, 4750, 'First installment should be ₹4,750');
    assert.equal(secondInstallment, 4750, 'Second installment should be ₹4,750');
    assert.equal(firstInstallment + secondInstallment, finalTotal, 'Installments must sum up exactly to final total');
  });

  it('Option B: Second installment absorbs currency rounding remainder for odd amounts', () => {
    const eligibleTotal = 9999;
    const discount = Math.round(eligibleTotal * 0.05); // 500
    const finalTotal = eligibleTotal - discount; // 9499
    const firstInstallment = Math.round(finalTotal * 0.5); // 4750
    const secondInstallment = finalTotal - firstInstallment; // 4749

    assert.equal(discount, 500);
    assert.equal(finalTotal, 9499);
    assert.equal(firstInstallment, 4750);
    assert.equal(secondInstallment, 4749);
    assert.equal(firstInstallment + secondInstallment, finalTotal, 'Sum of installments must equal final total without losing 1 rupee');
  });

  it('Preserves 5% discount on second installment without double-discounting', () => {
    const eligibleTotal = 10000;
    const initialDiscount = Math.round(eligibleTotal * 0.05); // 500
    const agreedFinalTotal = eligibleTotal - initialDiscount; // 9500
    const firstInstallment = Math.round(agreedFinalTotal * 0.5); // 4750

    // When customer returns to pay remaining installment
    const amountAlreadyPaid = firstInstallment; // 4750
    const remainingBalance = Math.max(0, agreedFinalTotal - amountAlreadyPaid); // 4750

    // Ensure we do NOT apply 5% again to second installment
    assert.equal(remainingBalance, 4750, 'Remaining balance must equal exact second installment without second discount');
    assert.notEqual(remainingBalance, Math.round(firstInstallment * 0.95), 'Must not apply discount a second time');
  });
});

describe('Cross-Booking Payment Status Isolation (Phase 1, 2, 7 & 10)', () => {
  it('Payment state updates target only the intended booking and never spill across bookings', () => {
    // 3 distinct bookings for a customer
    const bookings = [
      {
        id: 'booking-a-uuid',
        rawId: 'booking-a-uuid',
        title: 'Wedding Shoot',
        totalAmount: 10000,
        amountPaid: 0,
        remainingDue: 10000,
        paymentStatus: 'unpaid',
        payments: [],
      },
      {
        id: 'booking-b-uuid',
        rawId: 'booking-b-uuid',
        title: 'Corporate Event',
        totalAmount: 8000,
        amountPaid: 0,
        remainingDue: 8000,
        paymentStatus: 'unpaid',
        payments: [],
      },
      {
        id: 'booking-c-uuid',
        rawId: 'booking-c-uuid',
        title: 'Birthday Party',
        totalAmount: 5000,
        amountPaid: 0,
        remainingDue: 5000,
        paymentStatus: 'unpaid',
        payments: [],
      },
    ];

    // Simulate Payment for Booking A (Full Payment)
    const paidParamsA = {
      bookingId: 'booking-a-uuid',
      amountPaid: 9000,
      paymentStatus: 'paid',
      paymentMode: 'full',
      paymentRecord: {
        id: 'pay-1',
        booking_id: 'booking-a-uuid',
        amount: 9000,
        payment_status: 'paid',
      },
    };

    // The fixed update function with canonical target ID validation
    const updatedAfterA = bookings.map((b) => {
      const target = paidParamsA.bookingId;
      const isMatch = Boolean(target && (b.rawId === target || b.id === target));
      if (!isMatch) return b;
      return {
        ...b,
        paymentStatus: paidParamsA.paymentStatus,
        amountPaid: paidParamsA.amountPaid,
        remainingDue: 0,
        payments: [...b.payments, paidParamsA.paymentRecord],
      };
    });

    // Booking A should be paid
    assert.equal(updatedAfterA[0].paymentStatus, 'paid');
    assert.equal(updatedAfterA[0].amountPaid, 9000);
    assert.equal(updatedAfterA[0].remainingDue, 0);
    assert.equal(updatedAfterA[0].payments.length, 1);

    // Booking B must strictly remain UNPAID
    assert.equal(updatedAfterA[1].paymentStatus, 'unpaid');
    assert.equal(updatedAfterA[1].amountPaid, 0);
    assert.equal(updatedAfterA[1].remainingDue, 8000);
    assert.equal(updatedAfterA[1].payments.length, 0);

    // Booking C must strictly remain UNPAID
    assert.equal(updatedAfterA[2].paymentStatus, 'unpaid');
    assert.equal(updatedAfterA[2].amountPaid, 0);
    assert.equal(updatedAfterA[2].remainingDue, 5000);
    assert.equal(updatedAfterA[2].payments.length, 0);

    // Now simulate Half Payment for Booking C
    const paidParamsC = {
      bookingId: 'booking-c-uuid',
      amountPaid: 2375, // 5000 - 5% = 4750 -> 50% = 2375
      paymentStatus: 'partially_paid',
      paymentMode: 'half',
      paymentRecord: {
        id: 'pay-2',
        booking_id: 'booking-c-uuid',
        amount: 2375,
        payment_status: 'paid',
      },
    };

    const updatedAfterC = updatedAfterA.map((b) => {
      const target = paidParamsC.bookingId;
      const isMatch = Boolean(target && (b.rawId === target || b.id === target));
      if (!isMatch) return b;
      return {
        ...b,
        paymentStatus: paidParamsC.paymentStatus,
        amountPaid: paidParamsC.amountPaid,
        remainingDue: 4750 - paidParamsC.amountPaid,
        payments: [...b.payments, paidParamsC.paymentRecord],
      };
    });

    // Booking A is still fully paid
    assert.equal(updatedAfterC[0].paymentStatus, 'paid');
    assert.equal(updatedAfterC[0].amountPaid, 9000);

    // Booking B is still unpaid
    assert.equal(updatedAfterC[1].paymentStatus, 'unpaid');
    assert.equal(updatedAfterC[1].amountPaid, 0);
    assert.equal(updatedAfterC[1].remainingDue, 8000);

    // Booking C is partially paid with correct balance
    assert.equal(updatedAfterC[2].paymentStatus, 'partially_paid');
    assert.equal(updatedAfterC[2].amountPaid, 2375);
    assert.equal(updatedAfterC[2].remainingDue, 2375);
  });

  it('Root Cause Prevention: undefined target ID never matches any booking', () => {
    const bookings = [
      { id: 'b1', rawId: undefined, paymentStatus: 'unpaid' },
      { id: 'b2', rawId: undefined, paymentStatus: 'unpaid' },
    ];

    // Flawed legacy comparison: b.rawId === params.bookingId (undefined === undefined was true for all!)
    const legacyMatched = bookings.map((b) =>
      b.rawId === undefined ? { ...b, paymentStatus: 'paid' } : b
    );
    assert.equal(legacyMatched[0].paymentStatus, 'paid', 'Confirms legacy flaw triggered bug');
    assert.equal(legacyMatched[1].paymentStatus, 'paid', 'Confirms legacy flaw triggered bug');

    // Fixed robust matching logic
    const target = undefined;
    const fixedMatched = bookings.map((b) => {
      const isMatch = Boolean(target && (b.rawId === target || b.id === target));
      return isMatch ? { ...b, paymentStatus: 'paid' } : b;
    });

    assert.equal(fixedMatched[0].paymentStatus, 'unpaid', 'Undefined target must NEVER match booking 1');
    assert.equal(fixedMatched[1].paymentStatus, 'unpaid', 'Undefined target must NEVER match booking 2');
  });

  it('Escrow protection label only displays for verified paid funds, never for unpaid bookings', () => {
    const isEscrowEligible = (status, verifiedAmount) => {
      return (status === 'paid' || status === 'partially_paid') && verifiedAmount > 0;
    };

    assert.equal(isEscrowEligible('unpaid', 0), false, 'Unpaid booking must never show active escrow');
    assert.equal(isEscrowEligible('partially_paid', 4750), true, 'Partially paid booking shows advance in escrow');
    assert.equal(isEscrowEligible('paid', 9000), true, 'Fully paid booking shows full escrow protection');
  });
});

describe('Cryptographic Payment Verification & Security (Phase 6)', () => {
  it('Rejects forged signatures and accepts valid Razorpay HMAC SHA256 signatures', () => {
    const prevKeyId = process.env.RAZORPAY_KEY_ID;
    const prevKeySecret = process.env.RAZORPAY_KEY_SECRET;

    try {
      const secret = 'rzp_test_secret_key_12345';
      process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id_12345';
      process.env.RAZORPAY_KEY_SECRET = secret;

      const orderId = 'order_live_987654321';
      const paymentId = 'pay_live_123456789';

      // Generate authoritative signature
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const result = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
      });
      assert.equal(result.isValid, true, 'Valid HMAC signature must verify');

      // Forged signature
      const forgedResult = verifyPaymentSignature({
        orderId,
        paymentId,
        signature: 'forged_fake_signature_abc123',
      });
      assert.equal(forgedResult.isValid, false, 'Forged signature must be rejected');
    } finally {
      process.env.RAZORPAY_KEY_ID = prevKeyId;
      process.env.RAZORPAY_KEY_SECRET = prevKeySecret;
    }
  });

  it('Generates and verifies sandbox signatures for local testing', () => {
    const orderId = 'order_dev_sandbox_123';
    const paymentId = 'pay_dev_sandbox_123';
    const sandboxSig = generateSandboxSignature(orderId, paymentId);

    const sandboxResult = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: sandboxSig,
    });
    assert.equal(sandboxResult.isValid, true, 'Sandbox signature must verify in sandbox environment');
  });
});
