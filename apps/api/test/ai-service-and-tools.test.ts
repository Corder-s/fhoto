import test, { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { AiService } from '../src/ai/ai.service';
import { PhotographersService } from '../src/photographers/photographers.service';
import { BookingsService } from '../src/bookings/bookings.service';
import { GalleriesService } from '../src/galleries/galleries.service';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { ClientsService } from '../src/clients/clients.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../src/common/auth.guard';

describe('SnapShoot Real AI Assistant & Tool Execution Suite', () => {
  const prismaMock = new PrismaService();
  const photographersService = new PhotographersService(prismaMock);
  const bookingsService = new BookingsService(prismaMock);
  const galleriesService = new GalleriesService(prismaMock, bookingsService);
  const subscriptionsService = new SubscriptionsService(prismaMock);
  const clientsService = new ClientsService(prismaMock);

  const aiService = new AiService(
    photographersService,
    bookingsService,
    galleriesService,
    subscriptionsService,
    clientsService,
  );

  const customerUser: AuthenticatedUser = {
    id: 'usr-cust-aman',
    fullName: 'Aman Sharma',
    roles: [RoleType.CUSTOMER],
    customerId: 'cust-001',
  };

  const photographerUser: AuthenticatedUser = {
    id: 'usr-pro-aman',
    fullName: 'Aman Verma',
    roles: [RoleType.PHOTOGRAPHER],
    photographerId: 'pro-aman',
  };

  // ========================================================
  // 1. PROVIDER CONFIGURATION SAFETY & MISSING KEY HANDLING
  // ========================================================
  describe('Provider Configuration Safety', () => {
    it('should detect unconfigured OPENAI_API_KEY and return clear configuration error', async () => {
      // Unconfigured client state
      aiService.setOpenAiClient(null);
      assert.equal(aiService.isConfigured(), false);

      const res = await aiService.chat(
        { message: 'Find me top wedding photographers in Delhi' },
        customerUser,
      );

      assert.equal(res.success, false);
      assert.equal(res.isConfigured, false);
      assert.equal(res.error, 'OPENAI_API_KEY_MISSING');
      assert.match(res.reply, /OPENAI_API_KEY is not configured/i);
    });
  });

  // ========================================================
  // 2. ROLE-SPECIFIC ASSISTANT ROUTING
  // ========================================================
  describe('Role-Specific Assistant Routing', () => {
    it('Customer session routes to CUSTOMER assistant', async () => {
      const res = await aiService.chat(
        { message: 'Hello' },
        customerUser,
      );
      assert.equal(res.assistantRole, 'CUSTOMER');
    });

    it('Photographer session routes to PHOTOGRAPHER assistant', async () => {
      const res = await aiService.chat(
        { message: 'Hello' },
        photographerUser,
      );
      assert.equal(res.assistantRole, 'PHOTOGRAPHER');
    });

    it('Anonymous visitor session defaults to CUSTOMER assistant', async () => {
      const res = await aiService.chat(
        { message: 'Hello' },
        undefined,
      );
      assert.equal(res.assistantRole, 'CUSTOMER');
    });
  });

  // ========================================================
  // 3. MUTATING ACTIONS REQUIRE EXPLICIT CONFIRMATION
  // ========================================================
  describe('Mutating Actions Confirmation Guardrails', () => {
    it('Canceling a booking requires explicit user confirmation', async () => {
      const res = await aiService.chat(
        { message: 'I need to cancel booking SNP-2026-98042 immediately' },
        customerUser,
      );

      assert.equal(res.success, true);
      assert.ok(res.confirmationRequired, 'Must return confirmationRequired block');
      assert.equal(res.confirmationRequired?.action, 'CANCEL_BOOKING');
      assert.match(res.reply, /Confirmation Required/i);
    });

    it('Canceling subscription auto-renewal requires explicit confirmation', async () => {
      const res = await aiService.chat(
        { message: 'Please cancel subscription for my studio' },
        photographerUser,
      );

      assert.equal(res.success, true);
      assert.ok(res.confirmationRequired, 'Must return confirmationRequired block');
      assert.equal(res.confirmationRequired?.action, 'CANCEL_SUBSCRIPTION');
      assert.match(res.reply, /Subscription Cancellation Confirmation Required/i);
    });
  });

  // ========================================================
  // 4. BACKEND TOOLS EXECUTION & AUTHORIZATION
  // ========================================================
  describe('Backend Tools Execution & Verification', () => {
    it('searchPhotographers tool returns public verified creators', async () => {
      const photographers = await photographersService.getPublicPhotographers('New Delhi');
      assert.ok(photographers.length > 0);
      assert.ok(photographers.some((p) => p.name === 'Aman Verma'));
    });

    it('getMyBookings tool returns authorized bookings for customer', async () => {
      const bookings = await bookingsService.getMyBookings(customerUser);
      assert.ok(bookings.length > 0);
      assert.equal(bookings[0].customerId, 'cust-001');
    });

    it('getBookingStatus tool returns arrival and venue details', async () => {
      const status = await bookingsService.getBookingById('SNP-2026-98042', customerUser);
      assert.equal(status.bookingReference, 'SNP-2026-98042');
      assert.equal(status.status, 'ARRIVED_AT_VENUE');
    });

    it('getMyGalleryStatus tool returns delivered photos count', async () => {
      const gallery = await galleriesService.getBookingGallery('SNP-2026-97910', {
        ...customerUser,
        customerId: 'cust-002', // Authorized customer for this shoot
      });
      assert.ok(gallery.length > 0);
      assert.equal(gallery[0].bookingId, 'SNP-2026-97910');
    });

    it('getMyBusinessAnalytics tool aggregates real client CRM and earnings', async () => {
      const clients = await clientsService.getMyClients('pro-aman');
      const bookings = await bookingsService.getMyBookings(photographerUser);
      assert.ok(clients.length >= 3);
      assert.ok(bookings.length >= 1);
    });

    it('getMySubscription tool retrieves current tier and entitlements', async () => {
      const sub = await subscriptionsService.getCurrentSubscription('pro-aman');
      assert.equal(sub.subscription.photographerId, 'pro-aman');
      assert.ok(sub.plan.maxServicePackages > 0);
    });
  });

  // ========================================================
  // 5. MOCK OPENAI PROVIDER INTEGRATION & TOOL CALLING LOOP
  // ========================================================
  describe('Mock OpenAI Dynamic Tool Calling Loop', () => {
    it('should process function calling, execute tool, and return synthesized answer', async () => {
      // Simulate OpenAI client with function calling
      const mockOpenAi = {
        chat: {
          completions: {
            create: async (params: any) => {
              // If tools are provided and it is the first call
              if (params.messages.length === 2) {
                return {
                  choices: [
                    {
                      message: {
                        role: 'assistant',
                        content: null,
                        tool_calls: [
                          {
                            id: 'call_abc123',
                            type: 'function',
                            function: {
                              name: 'searchPhotographers',
                              arguments: JSON.stringify({ city: 'New Delhi' }),
                            },
                          },
                        ],
                      },
                    },
                  ],
                };
              }
              // Second call after tool execution:
              return {
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: 'I found top verified photographers in New Delhi including Aman Verma (Rating: 4.96).',
                    },
                  },
                ],
              };
            },
          },
        },
      } as any;

      aiService.setOpenAiClient(mockOpenAi);

      const res = await aiService.chat(
        { message: 'Who is available for shoots in Delhi?' },
        customerUser,
      );

      assert.equal(res.success, true);
      assert.equal(res.isConfigured, true);
      assert.ok(res.toolsUsed?.includes('searchPhotographers'));
      assert.match(res.reply, /Aman Verma/i);
    });

    it('should safely handle provider API exceptions', async () => {
      const failingOpenAi = {
        chat: {
          completions: {
            create: async () => {
              const err = new Error('Rate limit exceeded or invalid API key');
              (err as any).code = 'rate_limit_exceeded';
              throw err;
            },
          },
        },
      } as any;

      aiService.setOpenAiClient(failingOpenAi);

      const res = await aiService.chat(
        { message: 'Hello' },
        customerUser,
      );

      assert.equal(res.success, false);
      assert.equal(res.error, 'rate_limit_exceeded');
      assert.match(res.reply, /AI Provider Communication Error/i);
    });
  });
});
