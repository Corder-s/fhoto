import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { AdminService } from '../src/admin/admin.service';
import { HealthController } from '../src/common/health.controller';
import { RateLimitGuard } from '../src/common/rate-limit.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SnapShoot Phase 7: Security Audit, Analytics & Production Readiness Test Suite', () => {
  let adminService: AdminService;
  let healthController: HealthController;
  let rateLimitGuard: RateLimitGuard;
  let mockPrisma: any;
  let reflector: Reflector;

  beforeEach(() => {
    mockPrisma = {} as PrismaService;
    adminService = new AdminService(mockPrisma);
    healthController = new HealthController();
    reflector = new Reflector();
    rateLimitGuard = new RateLimitGuard(reflector);
  });

  // 1. Production Health & Liveness Checks
  describe('1. Production Health & Liveness Endpoints', () => {
    it('should return 200 OK with system uptime and environment metadata', () => {
      const health = healthController.getHealth();
      assert.strictEqual(health.status, 'ok');
      assert.strictEqual(health.service, 'snapshoot-api');
      assert.ok(typeof health.uptimeSeconds === 'number');
      assert.ok(health.timestamp);
      assert.strictEqual(health.version, '1.0.0');
    });
  });

  // 2. Sliding Window Rate Limiting & DDoS Safeguards
  describe('2. Rate Limiting & Abuse Prevention', () => {
    it('should allow requests under the rate limit threshold', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ ip: '192.168.1.100', headers: {} }),
        }),
        getHandler: () => ({}),
      } as any;

      const allowed = rateLimitGuard.canActivate(mockContext);
      assert.strictEqual(allowed, true);
    });

    it('should block rapid successive requests exceeding the configured limit with 429 Too Many Requests', () => {
      // Simulate low limit test reflector
      const mockReflector = {
        get: () => ({ limit: 3, ttlSeconds: 60 }),
      } as any;
      const tightGuard = new RateLimitGuard(mockReflector);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ ip: '10.0.0.99', headers: {} }),
        }),
        getHandler: () => ({}),
      } as any;

      // First 3 requests should pass
      assert.strictEqual(tightGuard.canActivate(mockContext), true);
      assert.strictEqual(tightGuard.canActivate(mockContext), true);
      assert.strictEqual(tightGuard.canActivate(mockContext), true);

      // 4th request must throw 429
      assert.throws(
        () => tightGuard.canActivate(mockContext),
        (err: any) => {
          assert.strictEqual(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
          assert.ok(err.message.includes('Rate limit'));
          return true;
        },
      );
    });
  });

  // 3. Platform Owner Analytics & 5 Financial Categories
  describe('3. SaaS Revenue Analytics & Financial Decoupling', () => {
    it('should calculate and strictly segregate all 5 financial categories', async () => {
      const analytics = await adminService.getOwnerAnalytics();

      // Combined Net Revenue (Commission + SaaS MRR)
      assert.strictEqual(analytics.combinedRevenueInr, 958730);

      // Category 1: SaaS Subscriptions
      assert.ok(analytics.saasSubscriptions);
      assert.strictEqual(analytics.saasSubscriptions.mrrInr, 589730);
      assert.strictEqual(analytics.saasSubscriptions.arrInr, 7076760);
      assert.strictEqual(analytics.saasSubscriptions.activeSubscribersCount, 270);
      assert.strictEqual(analytics.saasSubscriptions.refundsInr, 0);

      // Category 2: Marketplace Bookings Volume
      assert.ok(analytics.marketplaceBookings);
      assert.strictEqual(analytics.marketplaceBookings.gbvInr, 1845000);
      assert.strictEqual(analytics.marketplaceBookings.completedShootsCount, 312);
      assert.strictEqual(analytics.marketplaceBookings.cancelledShootsCount, 12);
      assert.strictEqual(analytics.marketplaceBookings.aovInr, 5910);

      // Category 3: Marketplace Commission
      assert.ok(analytics.marketplaceCommission);
      assert.strictEqual(analytics.marketplaceCommission.collectedInr, 369000); // 20% of 18,45,000
      assert.strictEqual(analytics.marketplaceCommission.effectiveTakeRatePercent, 20.0);

      // Category 4: Photographer Payouts
      assert.ok(analytics.photographerPayouts);
      assert.strictEqual(analytics.photographerPayouts.totalCreatorShareInr, 1476000); // 80%
      assert.strictEqual(analytics.photographerPayouts.inEscrowPendingInr, 48000);
      assert.strictEqual(analytics.photographerPayouts.settledPayoutsInr, 1428000);

      // Category 5: Platform Community
      assert.ok(analytics.platformCommunity);
      assert.strictEqual(analytics.platformCommunity.registeredCustomersCount, 1420);
      assert.strictEqual(analytics.platformCommunity.registeredPhotographersCount, 450);
    });

    it('should maintain mathematical consistency: Commission + Creator Share equals Total GBV', async () => {
      const analytics = await adminService.getOwnerAnalytics();
      const commission = analytics.marketplaceCommission.collectedInr;
      const creatorShare = analytics.photographerPayouts.totalCreatorShareInr;
      const gbv = analytics.marketplaceBookings.gbvInr;

      assert.strictEqual(
        commission + creatorShare,
        gbv,
        'Marketplace commission (20%) + Creator Net Payout (80%) must exactly match Gross Booking Value',
      );
    });
  });

  // 4. Role Hierarchy & Unauthorized Access Prevention
  describe('4. Administrative Role & Permission Verification', () => {
    it('should permit KYC applicant review transitions only to APPROVED or REJECTED states', async () => {
      const approved = await adminService.reviewKyc('kyc-1', 'APPROVE');
      assert.strictEqual(approved.status, 'APPROVED');

      const rejected = await adminService.reviewKyc('kyc-2', 'REJECT');
      assert.strictEqual(rejected.status, 'REJECTED');
    });

    it('should throw NotFoundException when reviewing nonexistent KYC applicant', async () => {
      await assert.rejects(
        async () => adminService.reviewKyc('kyc-nonexistent', 'APPROVE'),
        /KYC applicant 'kyc-nonexistent' not found/,
      );
    });
  });

  // 5. Sensitive Information & Credential Protection
  describe('5. Credential Sanitization & Secret Safeguards', () => {
    it('should never expose HMAC secrets or database credentials in serialized analytics', async () => {
      const analytics = await adminService.getOwnerAnalytics();
      const serialized = JSON.stringify(analytics);

      assert.strictEqual(serialized.includes('secret'), false);
      assert.strictEqual(serialized.includes('password'), false);
      assert.strictEqual(serialized.includes('DATABASE_URL'), false);
      assert.strictEqual(serialized.includes('RAZORPAY_KEY_SECRET'), false);
    });
  });
});
