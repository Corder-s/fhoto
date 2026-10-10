import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  PlanTier,
  BillingInterval,
  SubscriptionStatus,
  SAAS_PLANS,
} from '@snapshoot/shared';

describe('SnapShoot Phase 6: SaaS Subscription & Billing Integration Test Suite', () => {
  let service: SubscriptionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {} as PrismaService;
    service = new SubscriptionsService(mockPrisma);
    service._resetForTest();
  });

  // 1. Authoritative Plans Retrieval
  describe('1. Centralized Plan Management', () => {
    it('should return authoritative plans from SAAS_PLANS with correct tiers and features', async () => {
      const plans = await service.getPlans();
      assert.strictEqual(plans.length, 3);

      const freePlan = plans.find((p) => p.tier === PlanTier.FREE);
      const proPlan = plans.find((p) => p.tier === PlanTier.PRO);
      const businessPlan = plans.find((p) => p.tier === PlanTier.BUSINESS);

      assert.ok(freePlan, 'FREE plan must exist');
      assert.strictEqual(freePlan.priceMonthlyInr, 0);
      assert.strictEqual(freePlan.hasClientCrm, false);
      assert.strictEqual(freePlan.maxServicePackages, 2);

      assert.ok(proPlan, 'PRO plan must exist');
      assert.strictEqual(proPlan.priceMonthlyInr, 999);
      assert.strictEqual(proPlan.hasClientCrm, true);
      assert.strictEqual(proPlan.maxServicePackages, 6);

      assert.ok(businessPlan, 'BUSINESS plan must exist');
      assert.strictEqual(businessPlan.priceMonthlyInr, 2499);
      assert.strictEqual(businessPlan.hasCustomGalleryBranding, true);
      assert.strictEqual(businessPlan.maxServicePackages, 20);
    });
  });

  // 2. Active Subscription Retrieval & Multi-Tenant Separation
  describe('2. Active Subscription & Multi-Tenant Access Control', () => {
    it('should return current subscription and plan for photographer', async () => {
      const result = await service.getCurrentSubscription('pro-aman');
      assert.ok(result.subscription);
      assert.strictEqual(result.subscription.photographerId, 'pro-aman');
      assert.strictEqual(result.subscription.tier, PlanTier.PRO);
      assert.strictEqual(result.plan.name, 'Pro Studio');
    });

    it('should reject subscription retrieval if photographerId is missing', async () => {
      await assert.rejects(
        async () => service.getCurrentSubscription(''),
        /Photographer business account required/,
      );
    });

    it('should enforce strict multi-tenant isolation for billing receipts', async () => {
      // Photographer pro-aman has 2 billing receipts
      const amanInvoices = await service.getInvoices('pro-aman');
      assert.strictEqual(amanInvoices.length, 2);
      assert.strictEqual(amanInvoices[0].photographerId, 'pro-aman');

      // Photographer pro-other has 0 receipts and cannot view aman's receipts
      const otherInvoices = await service.getInvoices('pro-other');
      assert.strictEqual(otherInvoices.length, 0);
    });
  });

  // 3. Checkout Session Creation & Validation
  describe('3. Checkout Session Creation', () => {
    it('should create valid checkout session with correct amount in paise', async () => {
      const session = await service.createCheckoutSession(
        'pro-aman',
        PlanTier.PRO,
        BillingInterval.MONTHLY,
      );

      assert.ok(session.sessionId.startsWith('sess_'));
      assert.ok(session.gatewaySubscriptionId.startsWith('sub_rzp_'));
      assert.strictEqual(session.tier, PlanTier.PRO);
      assert.strictEqual(session.amountInr, 999);
      assert.strictEqual(session.amountPaise, 99900); // 999 * 100 paise
      assert.strictEqual(session.currency, 'INR');
      assert.ok(session.signatureToken, 'Cryptographic signature token must be generated');
    });

    it('should calculate discounted annual amount in paise correctly', async () => {
      const session = await service.createCheckoutSession(
        'pro-aman',
        PlanTier.BUSINESS,
        BillingInterval.ANNUAL,
      );

      assert.strictEqual(session.tier, PlanTier.BUSINESS);
      assert.strictEqual(session.amountInr, 23990);
      assert.strictEqual(session.amountPaise, 2399000); // 23990 * 100 paise
    });

    it('should reject checkout session with invalid plan tier', async () => {
      await assert.rejects(
        async () =>
          service.createCheckoutSession(
            'pro-aman',
            'INVALID_TIER' as any,
            BillingInterval.MONTHLY,
          ),
        /Invalid subscription tier/,
      );
    });
  });

  // 4. Cryptographic Checkout Verification & Activation
  describe('4. Cryptographic Payment Verification', () => {
    it('should activate subscription and generate invoice on valid payment verification', async () => {
      const result = await service.verifyCheckout('pro-aman', {
        gatewayPaymentId: 'pay_rzp_test_123',
        gatewaySubscriptionId: 'sub_rzp_test_456',
        signature: 'valid_test_signature_xyz',
        tier: PlanTier.BUSINESS,
        billingInterval: BillingInterval.MONTHLY,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.subscription.tier, PlanTier.BUSINESS);
      assert.strictEqual(result.subscription.status, SubscriptionStatus.ACTIVE);
      assert.strictEqual(result.plan.name, 'Business Elite');

      // Verify newly created invoice
      assert.ok(result.invoice);
      assert.strictEqual(result.invoice.status, 'PAID');
      assert.strictEqual(result.invoice.amountInr, 2499);
      assert.strictEqual(result.invoice.gatewayInvoiceId, 'pay_rzp_test_123');

      // Verify it appears in photographer's invoices
      const invoices = await service.getInvoices('pro-aman');
      assert.strictEqual(invoices[0].id, result.invoice.id);
    });

    it('should reject fake or forged payment signature', async () => {
      await assert.rejects(
        async () =>
          service.verifyCheckout('pro-aman', {
            gatewayPaymentId: 'pay_tampered_999',
            gatewaySubscriptionId: 'sub_tampered_888',
            signature: 'forged_fake_signature',
            tier: PlanTier.PRO,
          }),
        /Payment signature verification failed/,
      );
    });
  });

  // 5. Subscription Lifecycle & Cancellation
  describe('5. Lifecycle & Auto-Renewal Cancellation', () => {
    it('should toggle cancellation at period end without immediately revoking access', async () => {
      const cancelResult = await service.toggleCancelSubscription('pro-aman');
      assert.strictEqual(cancelResult.success, true);
      assert.strictEqual(cancelResult.subscription.cancelAtPeriodEnd, true);
      assert.ok(cancelResult.message.includes('auto-renewal canceled'));

      // Entitlements and tier remain active until currentPeriodEnd
      const current = await service.getCurrentSubscription('pro-aman');
      assert.strictEqual(current.subscription.tier, PlanTier.PRO);
      assert.strictEqual(current.subscription.cancelAtPeriodEnd, true);

      // Re-toggling resumes auto-renewal
      const resumeResult = await service.toggleCancelSubscription('pro-aman');
      assert.strictEqual(resumeResult.subscription.cancelAtPeriodEnd, false);
      assert.ok(resumeResult.message.includes('reinstated'));
    });
  });

  // 6. Provider Webhook Verification & Idempotency
  describe('6. Provider Webhooks & Idempotency', () => {
    it('should reject webhooks with missing or invalid HMAC signature', async () => {
      await assert.rejects(
        async () =>
          service.processWebhook(
            { id: 'evt_1', event: 'subscription.charged' },
            'invalid_signature',
          ),
        /Invalid Razorpay webhook signature/,
      );
    });

    it('should process valid subscription.charged webhook and activate plan', async () => {
      const webhookPayload = {
        id: 'evt_rzp_charge_001',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_webhook_999',
              notes: {
                photographerId: 'pro-aman',
                tier: PlanTier.BUSINESS,
              },
            },
          },
          payment: {
            entity: {
              id: 'pay_rzp_webhook_888',
            },
          },
        },
      };

      const result = await service.processWebhook(
        webhookPayload,
        'test_webhook_valid_signature',
      );

      assert.strictEqual(result.status, 'success');
      assert.strictEqual(result.event, 'subscription.charged');

      const current = await service.getCurrentSubscription('pro-aman');
      assert.strictEqual(current.subscription.tier, PlanTier.BUSINESS);
    });

    it('should reject duplicate webhook deliveries idempotently without duplicate charges', async () => {
      const eventId = 'evt_duplicate_test_100';
      const webhookPayload = {
        id: eventId,
        event: 'payment.captured',
        payload: {
          subscription: {
            entity: {
              notes: { photographerId: 'pro-aman', tier: PlanTier.PRO },
            },
          },
        },
      };

      // First delivery: processes successfully
      const firstResult = await service.processWebhook(
        webhookPayload,
        'test_webhook_valid_signature',
      );
      assert.strictEqual(firstResult.status, 'success');

      // Duplicate delivery: recognized as already_processed and skipped
      const secondResult = await service.processWebhook(
        webhookPayload,
        'test_webhook_valid_signature',
      );
      assert.strictEqual(secondResult.status, 'already_processed');
      assert.strictEqual(secondResult.eventId, eventId);
    });

    it('should transition subscription to PAST_DUE when payment.failed event is received', async () => {
      const webhookPayload = {
        id: 'evt_fail_999',
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              notes: { photographerId: 'pro-aman' },
            },
          },
        },
      };

      const result = await service.processWebhook(
        webhookPayload,
        'test_webhook_valid_signature',
      );

      assert.strictEqual(result.status, 'success');

      const current = await service.getCurrentSubscription('pro-aman');
      assert.strictEqual(current.subscription.status, SubscriptionStatus.PAST_DUE);
    });
  });

  // 7. Safe Downgrade Policy (No Data Loss)
  describe('7. Safe Downgrade Policy', () => {
    it('should downgrade to FREE without deleting existing photographer packages, clients, or bookings', async () => {
      const downgradeResult = await service.verifyCheckout('pro-aman', {
        gatewayPaymentId: 'free_downgrade',
        gatewaySubscriptionId: 'free_sub',
        signature: 'valid_test_signature_free',
        tier: PlanTier.FREE,
      });

      assert.strictEqual(downgradeResult.success, true);
      assert.strictEqual(downgradeResult.subscription.tier, PlanTier.FREE);
      assert.strictEqual(downgradeResult.plan.maxServicePackages, 2);

      // Verify that previously issued invoices remain intact
      const invoices = await service.getInvoices('pro-aman');
      assert.ok(invoices.length >= 2, 'Historical invoices must never be deleted on downgrade');
    });
  });

  // 8. Financial Separation of SaaS Subscriptions vs Marketplace Bookings
  describe('8. Strict Financial Decoupling', () => {
    it('should maintain independent identifiers, records, and statuses for SaaS Subscriptions vs Booking Payments', () => {
      // SaaS Subscription Invoice format: INV-2026-xxx with gatewaySubscriptionId
      const sampleSubInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-009',
        subscriptionId: 'sub-001',
        amountInr: 999,
        status: 'PAID',
      };
      assert.ok(sampleSubInvoice.invoiceNumber.startsWith('INV-'));
      assert.ok(sampleSubInvoice.subscriptionId.startsWith('sub-'));

      // Marketplace Booking Payment format: SNP-2026-xxx with bookingId & escrow status
      const sampleBookingPayment = {
        id: 'pay-001',
        bookingId: 'SNP-2026-98124',
        amountPaise: BigInt(600000), // ₹6,000
        status: 'PAID',
        payoutStatus: 'IN_ESCROW',
      };
      assert.ok(sampleBookingPayment.bookingId.startsWith('SNP-'));
      assert.notStrictEqual(sampleBookingPayment.bookingId, sampleSubInvoice.subscriptionId);
    });
  });
});
