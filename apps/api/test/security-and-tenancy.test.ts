import test, { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { AuthService } from '../src/auth/auth.service';
import { PhotographersService } from '../src/photographers/photographers.service';
import { ClientsService } from '../src/clients/clients.service';
import { BookingsService } from '../src/bookings/bookings.service';
import { GalleriesService } from '../src/galleries/galleries.service';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { AdminService } from '../src/admin/admin.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RoleType, PlanTier } from '@snapshoot/shared';
import { AuthenticatedUser } from '../src/common/auth.guard';

// Test environment: enable the development-only mock login so the OTP assertions below exercise it.
// Mock auth is refused when NODE_ENV=production, and the assertions are unchanged.
process.env.ENABLE_MOCK_AUTH = 'true';

describe('SnapShoot Backend Security, Tenancy & Authorization Test Suite', () => {
  const prismaMock = new PrismaService();
  const jwtService = new JwtService({ secret: 'test-secret-key' });

  const authService = new AuthService(jwtService, prismaMock);
  const photographersService = new PhotographersService(prismaMock);
  const clientsService = new ClientsService(prismaMock);
  const bookingsService = new BookingsService(prismaMock);
  const galleriesService = new GalleriesService(prismaMock, bookingsService);
  const subscriptionsService = new SubscriptionsService(prismaMock);
  const adminService = new AdminService(prismaMock);

  // Authenticated Test Users
  const customerAman: AuthenticatedUser = {
    id: 'usr-cust-aman',
    fullName: 'Aman Sharma',
    roles: [RoleType.CUSTOMER],
    customerId: 'cust-001',
  };

  const customerPriya: AuthenticatedUser = {
    id: 'usr-cust-priya',
    fullName: 'Priya Sundaram',
    roles: [RoleType.CUSTOMER],
    customerId: 'cust-002',
  };

  const photographerAman: AuthenticatedUser = {
    id: 'usr-pro-aman',
    fullName: 'Aman Verma',
    roles: [RoleType.PHOTOGRAPHER],
    photographerId: 'pro-aman',
  };

  const photographerRohan: AuthenticatedUser = {
    id: 'usr-pro-rohan',
    fullName: 'Rohan Joshi',
    roles: [RoleType.PHOTOGRAPHER],
    photographerId: 'pro-rohan', // Competing Photographer Tenant!
  };

  const platformOwner: AuthenticatedUser = {
    id: 'usr-owner-1',
    fullName: 'Platform Owner',
    roles: [RoleType.OWNER],
  };

  // ========================================================
  // 1. AUTHENTICATION & TOKEN ISSUANCE
  // ========================================================
  describe('Authentication & Session Issuance', () => {
    it('should issue signed JWT and reject invalid OTP codes', async () => {
      // 1. Valid OTP
      const res = await authService.verifyOtp('9811234567', '123456', RoleType.CUSTOMER);
      assert.ok(res.accessToken, 'Must return JWT token');
      assert.equal(res.user.roles[0], RoleType.CUSTOMER);

      // 2. Invalid OTP must be rejected
      await assert.rejects(
        () => authService.verifyOtp('9811234567', '000000', RoleType.CUSTOMER),
        { name: 'UnauthorizedException' },
      );
    });
  });

  // ========================================================
  // 2. MULTI-TENANT DATA ISOLATION (CLIENT CRM)
  // ========================================================
  describe('Multi-Tenant Client CRM Isolation', () => {
    it('Photographer A can access their own clients', async () => {
      const clients = await clientsService.getMyClients('pro-aman');
      assert.ok(clients.length > 0, 'Should return client list');
      assert.equal(clients[0].photographerId, 'pro-aman');
    });

    it('Photographer B CANNOT view Photographer A client records by ID', async () => {
      // Photographer Rohan tries to access Karan Mehta (owned by Aman)
      await assert.rejects(
        () => clientsService.getClientById('pro-rohan', 'cli-001'),
        (err: any) => {
          assert.equal(err.status, 403);
          assert.match(err.message, /Cross-tenant access rejected/i);
          return true;
        },
      );
    });

    it('Photographer B CANNOT edit Photographer A client records', async () => {
      await assert.rejects(
        () => clientsService.updateClient('pro-rohan', 'cli-001', { notes: 'Hacked note' }),
        (err: any) => {
          assert.equal(err.status, 403);
          assert.match(err.message, /Cross-tenant modification rejected/i);
          return true;
        },
      );
    });

    it('Photographer B CANNOT delete Photographer A client records', async () => {
      await assert.rejects(
        () => clientsService.deleteClient('pro-rohan', 'cli-001'),
        (err: any) => {
          assert.equal(err.status, 403);
          assert.match(err.message, /Cross-tenant deletion rejected/i);
          return true;
        },
      );
    });
  });

  // ========================================================
  // 3. SERVICE PACKAGE OWNERSHIP & TENANCY
  // ========================================================
  describe('Service Package Ownership & Tenancy', () => {
    it('Photographer B cannot modify or delete Photographer A packages', async () => {
      // Rohan attempts to modify package 'pkg-1' owned by Aman
      await assert.rejects(
        () => photographersService.updatePackage('pro-rohan', 'pkg-1', { priceInr: 1 }),
        { name: 'NotFoundException' },
      );

      await assert.rejects(
        () => photographersService.deletePackage('pro-rohan', 'pkg-1'),
        { name: 'NotFoundException' },
      );
    });

    it('Rejects invalid package prices and zero duration', async () => {
      await assert.rejects(
        () =>
          photographersService.createPackage('pro-aman', {
            tierName: 'Broken Package',
            description: 'Invalid',
            durationHours: 0,
            editedPhotosCount: 5,
            rawPhotosIncluded: false,
            priceInr: -500,
          }),
        { name: 'BadRequestException' },
      );
    });
  });

  // ========================================================
  // 4. BOOKING ACCESS CONTROL & OTP MASKING
  // ========================================================
  describe('Booking Authorization & OTP Security', () => {
    it('Customer A can view their own booking with unmasked OTP', async () => {
      const booking = await bookingsService.getBookingById('SNP-2026-98042', customerAman);
      assert.equal(booking.id, 'SNP-2026-98042');
      assert.equal(booking.shootStartOtp, '482910', 'Customer must see unmasked OTP');
    });

    it('Customer B CANNOT view Customer A private booking', async () => {
      await assert.rejects(
        () => bookingsService.getBookingById('SNP-2026-98042', customerPriya),
        (err: any) => {
          assert.equal(err.status, 403);
          return true;
        },
      );
    });

    it('Photographer receives MASKED OTP until customer shares it on arrival', async () => {
      const booking = await bookingsService.getBookingById('SNP-2026-98042', photographerAman);
      assert.equal(booking.shootStartOtp, '••••••', 'Photographer must NEVER see unmasked OTP in advance');
    });

    it('Photographer verifies correct OTP on arrival to transition shoot to IN_PROGRESS', async () => {
      const res = await bookingsService.verifyArrivalOtp('SNP-2026-98042', '482910', photographerAman);
      assert.equal(res.success, true);
      assert.equal(res.booking.status, 'IN_PROGRESS');
    });

    it('Wrong OTP is rejected', async () => {
      await assert.rejects(
        () => bookingsService.verifyArrivalOtp('SNP-2026-98042', '000000', photographerAman),
        { name: 'BadRequestException' },
      );
    });
  });

  // ========================================================
  // 5. PRIVATE GALLERY ACCESS CONTROL
  // ========================================================
  describe('Private Gallery Access Control', () => {
    it('Customer A cannot view Customer B private delivered gallery', async () => {
      // Booking SNP-2026-97910 belongs to Priya (cust-002). Aman Sharma (cust-001) must be rejected!
      await assert.rejects(
        () => galleriesService.getBookingGallery('SNP-2026-97910', customerAman),
        { name: 'ForbiddenException' },
      );
    });

    it('Authorized customer and photographer can view gallery photos', async () => {
      const photos = await galleriesService.getBookingGallery('SNP-2026-97910', customerPriya);
      assert.ok(photos.length > 0);
      assert.equal(photos[0].bookingId, 'SNP-2026-97910');
    });
  });

  // ========================================================
  // 6. SAAS SUBSCRIPTIONS & ENTITLEMENTS
  // ========================================================
  describe('SaaS Subscriptions & Plan Changes', () => {
    it('Returns active subscription and invoices for photographer', async () => {
      const data = await subscriptionsService.getCurrentSubscription('pro-aman');
      assert.equal(data.subscription.photographerId, 'pro-aman');
      assert.equal(data.plan.tier, PlanTier.PRO);

      const invoices = await subscriptionsService.getInvoices('pro-aman');
      assert.ok(invoices.length >= 2, 'Should have invoice receipts');
    });
  });

  // ========================================================
  // 7. PLATFORM OWNER ANALYTICS & KYC DESK
  // ========================================================
  describe('Owner Operations Desk', () => {
    it('Returns platform liquidity combining marketplace GBV and SaaS MRR', async () => {
      const analytics = await adminService.getOwnerAnalytics();
      assert.equal(analytics.combinedRevenueInr, 958730);
      assert.equal(analytics.marketplace.commissionInr, 369000);
      assert.equal(analytics.saas.mrrInr, 589730);
    });
  });
});
