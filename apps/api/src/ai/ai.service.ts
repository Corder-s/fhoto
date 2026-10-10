import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../common/auth.guard';
import { ChatRequestDto, ChatResponseDto } from './ai.dto';
import { PhotographersService } from '../photographers/photographers.service';
import { BookingsService } from '../bookings/bookings.service';
import { GalleriesService } from '../galleries/galleries.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly modelName: string;

  constructor(
    private readonly photographersService: PhotographersService,
    private readonly bookingsService: BookingsService,
    private readonly galleriesService: GalleriesService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly clientsService: ClientsService,
  ) {
    const key = process.env.OPENAI_API_KEY;
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (key && key.trim() !== '' && key !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey: key.trim() });
      this.logger.log(`Initialized OpenAI AI Service with model: ${this.modelName}`);
    } else {
      this.logger.warn('OPENAI_API_KEY not found or unconfigured. AI responses will inform the user of missing configuration.');
    }
  }

  // Setter for automated testing and dependency injection
  setOpenAiClient(client: OpenAI | null) {
    this.openai = client;
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  // Authoritative Help Knowledge Base for Customer Assistant
  private getHelpArticle(topic: string) {
    const articles: Record<string, string> = {
      booking_workflow:
        'SnapShoot Booking Workflow: 1. Browse & select photographer package. 2. Choose date & location. 3. Pay securely into escrow. 4. Photographer arrives at venue. 5. Share your 6-digit Shoot OTP verbally upon physical arrival. 6. Shoot takes place. 7. Edited photos delivered within promised turnaround (typically 48h to 7 days).',
      shoot_otp:
        'Shoot Start OTP: To protect your payment and verify physical creator arrival, an arrival OTP is generated for each confirmed shoot. This OTP is strictly visible on your customer dashboard. NEVER share it over chat or phone beforehand. Share it ONLY after the photographer has physically arrived at your shoot venue.',
      cancellation_refund:
        'Cancellation & Refund Policy: Cancellations requested more than 24 hours before the scheduled shoot receive a 100% full refund to the original payment source. Cancellations within 24 hours incur a 50% creator compensation fee. If a photographer fails to arrive, a 100% immediate refund is issued.',
      pricing:
        'Transparent Pricing: All package prices on SnapShoot are all-inclusive with zero surprise hidden charges. Equipment, travel within local radius, shoot time, and digital retouched photos are included in the package price.',
    };
    return articles[topic] || articles.booking_workflow;
  }

  // Customer Assistant Tool Definitions
  private getCustomerTools(): OpenAI.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'searchPhotographers',
          description: 'Search verified photographers by city and/or genre category (portrait, wedding, event, commercial, couple)',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string', description: 'City name (e.g. New Delhi, Mumbai, Bengaluru)' },
              category: { type: 'string', description: 'Photography category' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyBookings',
          description: 'Retrieve all photography bookings made by the authenticated customer',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getBookingStatus',
          description: 'Get shoot arrival, venue, and completion status for a specific booking reference',
          parameters: {
            type: 'object',
            properties: {
              bookingReference: { type: 'string', description: 'Reference code (e.g. SNP-2026-98042)' },
            },
            required: ['bookingReference'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyGalleryStatus',
          description: 'Check delivered photos and gallery status for a booking',
          parameters: {
            type: 'object',
            properties: {
              bookingReference: { type: 'string', description: 'Reference code (e.g. SNP-2026-97910)' },
            },
            required: ['bookingReference'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getHelpArticle',
          description: 'Retrieve official SnapShoot help documentation and policies',
          parameters: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                enum: ['booking_workflow', 'shoot_otp', 'cancellation_refund', 'pricing'],
                description: 'The help topic needed',
              },
            },
            required: ['topic'],
          },
        },
      },
    ];
  }

  // Photographer Business Assistant Tool Definitions
  private getPhotographerTools(): OpenAI.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'getMyBusinessProfile',
          description: 'Retrieve current photographer studio profile, experience, gear list, and service area',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyPackages',
          description: 'Retrieve photography packages, pricing tiers, and shoot durations',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyAvailability',
          description: 'Retrieve shoot calendar availability slots and blocked dates',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyBookingRequests',
          description: 'Retrieve assigned customer shoots and their current workflow status',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMySubscription',
          description: 'Retrieve SaaS subscription tier, plan limits, and feature entitlements',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getMyBusinessAnalytics',
          description: 'Retrieve authorized business analytics: client count, completed shoots, and total revenue',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];
  }

  // Execute Approved Backend Functions
  private async executeTool(
    name: string,
    args: any,
    user?: AuthenticatedUser,
    isPhotographer: boolean = false,
  ): Promise<any> {
    // 1. Cross-Role Security Boundary: Customers cannot invoke photographer tools
    if (!isPhotographer && [
      'getMyBusinessProfile',
      'getMyPackages',
      'getMyAvailability',
      'getMySubscription',
      'getMyBusinessAnalytics'
    ].includes(name)) {
      return { error: 'Access denied: Photographer business account required for this tool.' };
    }

    try {
      switch (name) {
        // Customer Tools
        case 'searchPhotographers': {
          const list = await this.photographersService.getPublicPhotographers(args.city, args.category);
          return list.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            tagline: p.tagline,
            rating: p.rating,
            reviewsCount: p.reviewsCount,
            experienceYears: p.experienceYears,
          }));
        }

        case 'getMyBookings': {
          if (!user) return { error: 'Authentication required to access personal bookings.' };
          const bookings = await this.bookingsService.getMyBookings(user);
          return bookings.map((b) => ({
            bookingReference: b.bookingReference,
            photographerName: b.photographerName,
            category: b.category,
            packageTitle: b.packageTitle,
            shootDate: b.shootDate,
            timeSlot: b.timeSlot,
            status: b.status,
            venueAddress: b.venueAddress,
            totalAmountInr: b.totalAmountInr,
          }));
        }

        case 'getBookingStatus': {
          if (!user) return { error: 'Authentication required to inspect booking status.' };
          const booking = await this.bookingsService.getBookingById(args.bookingReference, user);
          return {
            bookingReference: booking.bookingReference,
            photographerName: booking.photographerName,
            category: booking.category,
            shootDate: booking.shootDate,
            timeSlot: booking.timeSlot,
            status: booking.status,
            venueAddress: booking.venueAddress,
            deliveredPhotosCount: booking.deliveredPhotosCount,
            isOtpRequired: booking.status === 'ARRIVED_AT_VENUE',
          };
        }

        case 'getMyGalleryStatus': {
          if (!user) return { error: 'Authentication required to inspect gallery delivery.' };
          const photos = await this.galleriesService.getBookingGallery(args.bookingReference, user);
          return {
            bookingReference: args.bookingReference,
            deliveredPhotosCount: photos.length,
            photos: photos.map((p) => ({ title: p.title, url: p.url, deliveredAt: p.deliveredAt })),
          };
        }

        case 'getHelpArticle': {
          return { topic: args.topic, content: this.getHelpArticle(args.topic) };
        }

        // Photographer Tools
        case 'getMyBusinessProfile': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          return await this.photographersService.getMyBusinessProfile(user.photographerId);
        }

        case 'getMyPackages': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          return await this.photographersService.getMyPackages(user.photographerId);
        }

        case 'getMyAvailability': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          return await this.photographersService.getMyAvailability(user.photographerId);
        }

        case 'getMyBookingRequests': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          const bookings = await this.bookingsService.getMyBookings(user);
          return bookings.map((b) => ({
            bookingReference: b.bookingReference,
            customerName: b.customerName,
            category: b.category,
            shootDate: b.shootDate,
            status: b.status,
            venueAddress: b.venueAddress,
            totalAmountInr: b.totalAmountInr,
          }));
        }

        case 'getMySubscription': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          const subData = await this.subscriptionsService.getCurrentSubscription(user.photographerId);
          return {
            tier: subData.subscription.tier,
            status: subData.subscription.status,
            billingInterval: subData.subscription.billingInterval,
            periodEnd: subData.subscription.currentPeriodEnd,
            planName: subData.plan.name,
            maxServicePackages: subData.plan.maxServicePackages,
            maxPortfolioItems: subData.plan.maxPortfolioItems,
            hasClientCrm: subData.plan.hasClientCrm,
            hasAdvancedAnalytics: subData.plan.hasAdvancedAnalytics,
            features: subData.plan.features,
          };
        }

        case 'getMyBusinessAnalytics': {
          if (!user?.photographerId) return { error: 'Photographer business account required.' };
          const clients = await this.clientsService.getMyClients(user.photographerId);
          const bookings = await this.bookingsService.getMyBookings(user);
          const completed = bookings.filter((b) => b.status === 'COMPLETED');
          const totalEarnedInr = completed.reduce((acc, b) => acc + (b.totalAmountInr * 0.8), 0);

          return {
            totalClientsCount: clients.length,
            totalBookingsCount: bookings.length,
            completedShootsCount: completed.length,
            netCreatorEarningsInr: totalEarnedInr,
            rating: 4.96,
            recentClients: clients.slice(0, 3).map((c) => ({ name: c.name, shoots: c.totalShoots, status: c.status })),
          };
        }

        default:
          return { error: `Unrecognized backend tool '${name}'.` };
      }
    } catch (err: any) {
      return { error: err.message || 'Error occurred while executing backend tool.' };
    }
  }

  // Core Dynamic Chat Handler
  async chat(dto: ChatRequestDto, user?: AuthenticatedUser): Promise<ChatResponseDto> {
    // Determine Assistant Role from Authenticated Identity
    const isPhotographer = !!(
      user &&
      user.roles &&
      user.roles.includes(RoleType.PHOTOGRAPHER) &&
      user.photographerId
    );
    const assistantRole: 'CUSTOMER' | 'PHOTOGRAPHER' = isPhotographer ? 'PHOTOGRAPHER' : 'CUSTOMER';

    // Check if mutating action requires confirmation
    const lowerMsg = dto.message.toLowerCase();
    if (lowerMsg.includes('cancel booking') || lowerMsg.includes('cancel my shoot')) {
      return {
        success: true,
        isConfigured: true,
        assistantRole,
        reply:
          '⚠️ Cancellation Confirmation Required:\nCanceling a booking triggers our cancellation and refund policy. If canceled more than 24 hours prior, you receive a 100% refund; within 24 hours, a 50% creator compensation fee applies. To proceed safely, please confirm by visiting your Bookings page or replying: "CONFIRM CANCEL <Booking-Reference>".',
        suggestions: ['View Bookings', 'Review Refund Policy'],
        confirmationRequired: {
          action: 'CANCEL_BOOKING',
          description: 'Cancel scheduled photography shoot and process applicable refund.',
          params: { message: dto.message },
        },
      };
    }

    if (lowerMsg.includes('cancel subscription') || lowerMsg.includes('cancel renewal')) {
      return {
        success: true,
        isConfigured: true,
        assistantRole,
        reply:
          '⚠️ Subscription Cancellation Confirmation Required:\nCanceling your subscription auto-renewal will allow you to keep all Pro studio features until the end of your current billing cycle. Afterward, your account will transition to Free Starter. Please confirm if you wish to toggle off auto-renewal.',
        suggestions: ['Confirm Auto-Renewal Cancellation', 'Keep My Pro Plan'],
        confirmationRequired: {
          action: 'CANCEL_SUBSCRIPTION',
          description: 'Toggle off auto-renewal for SaaS subscription.',
          params: { photographerId: user?.photographerId },
        },
      };
    }

    // Provider Configuration Guard: Fail clearly and safely if key is absent
    if (!this.openai) {
      return {
        success: false,
        isConfigured: false,
        assistantRole,
        reply:
          '⚠️ OpenAI Provider Not Configured:\nOPENAI_API_KEY is not configured on the SnapShoot backend server. To enable real dynamic AI responses, please add OPENAI_API_KEY in your server environment (.env).',
        error: 'OPENAI_API_KEY_MISSING',
        suggestions: ['How to book a shoot', 'Pricing plans', 'Contact Support'],
      };
    }

    // Role-Specific System Prompts
    const customerSystemPrompt = `You are SnapShoot's Customer AI Assistant.
SnapShoot is India's leading on-demand photographer booking marketplace.
Your goal is to help customers find verified photographers, check booking statuses, understand shoot workflows, view delivered galleries, and understand cancellation policies.
Guidelines:
- When the user asks to find photographers, use the searchPhotographers tool.
- When the user asks about their bookings or status, use getMyBookings or getBookingStatus.
- When the user asks about photos or delivered galleries, use getMyGalleryStatus.
- When the user asks about shoot OTP, workflows, or refunds, use getHelpArticle.
- Always be polite, warm, and helpful. Use clear bullet points when summarizing lists or options.
- Never invent booking references, payment states, or photographers.`;

    const photographerSystemPrompt = `You are SnapShoot's Photographer Business AI Assistant.
You assist professional photographers in managing and scaling their photography businesses.
Guidelines:
- When asked about their profile, gear, or service area, use getMyBusinessProfile.
- When asked about packages, pricing, or duration, use getMyPackages.
- When asked about schedule or availability, use getMyAvailability.
- When asked about client shoots, use getMyBookingRequests.
- When asked about subscription tier or limits, use getMySubscription.
- When asked about business performance, revenue, or why they are getting fewer bookings, use getMyBusinessAnalytics.
- When analyzing low bookings, evaluate their package pricing, review count, and availability to offer constructive, actionable business advice.
- Never invent revenue figures or client records.`;

    const systemPrompt = isPhotographer ? photographerSystemPrompt : customerSystemPrompt;
    const tools = isPhotographer ? this.getPhotographerTools() : this.getCustomerTools();

    // Prepare OpenAI Messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dto.history && Array.isArray(dto.history)) {
      for (const h of dto.history.slice(-8)) {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content,
        });
      }
    }

    messages.push({ role: 'user', content: dto.message });

    const toolsUsed: string[] = [];

    try {
      // 1. Initial Model Call with Function Calling enabled
      let completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 800,
      });

      let choice = completion.choices[0];

      // 2. Handle Tool Calls if the model requests them
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // Append model's assistant message with tool calls
        messages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type === 'function') {
            const funcName = toolCall.function.name;
            toolsUsed.push(funcName);

            let args = {};
            try {
              args = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              args = {};
            }

            const toolResult = await this.executeTool(funcName, args, user, isPhotographer);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        }

        // 3. Follow-up Call: Let the model synthesize natural-language answer with tool output
        completion = await this.openai.chat.completions.create({
          model: this.modelName,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        });

        choice = completion.choices[0];
      }

      const reply = choice.message.content || 'I processed your request, but received no response text.';

      // Generate context-aware suggestions
      const suggestions = isPhotographer
        ? ['How are my bookings this month?', 'Check my packages', 'My subscription status']
        : ['Find photographers in Delhi', 'Where are my photos?', 'How does Shoot OTP work?'];

      return {
        success: true,
        isConfigured: true,
        reply,
        assistantRole,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        suggestions,
      };
    } catch (err: any) {
      this.logger.error(`OpenAI provider error: ${err.message}`, err.stack);
      return {
        success: false,
        isConfigured: true,
        assistantRole,
        reply: `⚠️ AI Provider Communication Error: ${err.message || 'Unable to connect to model service.'}`,
        error: err.code || 'OPENAI_API_ERROR',
        suggestions: ['Retry your question', 'Contact customer support'],
      };
    }
  }
}
