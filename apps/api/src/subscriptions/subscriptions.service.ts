import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SAAS_PLANS,
  PlanTier,
  BillingInterval,
  SubscriptionStatus,
  SubscriptionPlanDto,
  PhotographerSubscriptionDto,
} from '@snapshoot/shared';

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  planName: string;
  amountInr: number;
  status: 'PAID' | 'PENDING';
  date: string;
}

@Injectable()
export class SubscriptionsService {
  private subscriptionStore: Map<string, PhotographerSubscriptionDto> = new Map([
    [
      'pro-aman',
      {
        id: 'sub-001',
        photographerId: 'pro-aman',
        planId: 'plan-pro',
        tier: PlanTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: '2026-10-01T00:00:00.000Z',
        currentPeriodEnd: '2026-11-01T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      },
    ],
  ]);

  private invoicesStore: Map<string, InvoiceDto[]> = new Map([
    [
      'pro-aman',
      [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-009',
          subscriptionId: 'sub-001',
          planName: 'Pro Studio Monthly',
          amountInr: 1999,
          status: 'PAID',
          date: '01 Oct 2026',
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2026-008',
          subscriptionId: 'sub-001',
          planName: 'Pro Studio Monthly',
          amountInr: 1999,
          status: 'PAID',
          date: '01 Sep 2026',
        },
      ],
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  // List all available plans
  async getPlans(): Promise<SubscriptionPlanDto[]> {
    return SAAS_PLANS;
  }

  // Get active subscription for current photographer
  async getCurrentSubscription(photographerId: string): Promise<{
    subscription: PhotographerSubscriptionDto;
    plan: SubscriptionPlanDto;
  }> {
    if (!photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }

    let sub = this.subscriptionStore.get(photographerId);
    if (!sub) {
      // Default to FREE starter
      sub = {
        id: `sub-${photographerId}`,
        photographerId,
        planId: 'plan-free',
        tier: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
      };
      this.subscriptionStore.set(photographerId, sub);
    }

    const plan = SAAS_PLANS.find((p) => p.tier === sub.tier) || SAAS_PLANS[0];

    return {
      subscription: sub,
      plan,
    };
  }

  // Request subscription plan change
  async changePlan(
    photographerId: string,
    targetTier: PlanTier,
    interval: BillingInterval = BillingInterval.MONTHLY,
  ): Promise<{
    success: boolean;
    subscription: PhotographerSubscriptionDto;
    plan: SubscriptionPlanDto;
  }> {
    if (!photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }

    const targetPlan = SAAS_PLANS.find((p) => p.tier === targetTier);
    if (!targetPlan) {
      throw new BadRequestException(`Invalid subscription tier: '${targetTier}'.`);
    }

    const currentSub = (await this.getCurrentSubscription(photographerId)).subscription;

    const updated: PhotographerSubscriptionDto = {
      ...currentSub,
      planId: targetPlan.id,
      tier: targetTier,
      billingInterval: interval,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + (interval === BillingInterval.ANNUAL ? 365 : 30) * 86400000,
      ).toISOString(),
    };

    this.subscriptionStore.set(photographerId, updated);

    // If upgrading to paid tier, generate invoice receipt
    if (targetTier !== PlanTier.FREE) {
      const price = interval === BillingInterval.ANNUAL ? targetPlan.priceAnnualInr : targetPlan.priceMonthlyInr;
      const invoices = this.invoicesStore.get(photographerId) || [];
      const newInvoice: InvoiceDto = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        invoiceNumber: `INV-2026-${(invoices.length + 10).toString().padStart(3, '0')}`,
        subscriptionId: updated.id,
        planName: `${targetPlan.name} ${interval === BillingInterval.ANNUAL ? 'Annual' : 'Monthly'}`,
        amountInr: price,
        status: 'PAID',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      this.invoicesStore.set(photographerId, [newInvoice, ...invoices]);
    }

    return {
      success: true,
      subscription: updated,
      plan: targetPlan,
    };
  }

  // Get photographer billing receipts
  async getInvoices(photographerId: string): Promise<InvoiceDto[]> {
    return this.invoicesStore.get(photographerId) || [];
  }
}
