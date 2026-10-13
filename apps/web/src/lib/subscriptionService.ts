'use client';

import {
  PlanTier,
  SubscriptionStatus,
  BillingInterval,
  SubscriptionPlanDto,
  PhotographerSubscriptionDto,
  SAAS_PLANS
} from '@snapshoot/shared';

const SUBSCRIPTION_STORAGE_KEY = 'snapshoot_photographer_subscription';

export const DEFAULT_DEMO_SUBSCRIPTION: PhotographerSubscriptionDto = {
  id: 'sub-demo-001',
  photographerId: 'pro-aman',
  planId: 'plan-pro',
  tier: PlanTier.PRO,
  status: SubscriptionStatus.ACTIVE,
  billingInterval: BillingInterval.MONTHLY,
  currentPeriodStart: '2026-10-01T00:00:00.000Z',
  currentPeriodEnd: '2026-11-01T00:00:00.000Z',
  cancelAtPeriodEnd: false,
};

export function getStoredSubscription(): PhotographerSubscriptionDto {
  if (typeof window === 'undefined') return DEFAULT_DEMO_SUBSCRIPTION;

  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PhotographerSubscriptionDto;
    }
  } catch (err) {
    console.error('Error reading subscription state:', err);
  }

  return DEFAULT_DEMO_SUBSCRIPTION;
}

export function saveStoredSubscription(sub: PhotographerSubscriptionDto): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
    window.dispatchEvent(new Event('snapshoot:subscription-change'));
  } catch (err) {
    console.error('Error saving subscription state:', err);
  }
}

export function getPlanDetails(tier: PlanTier): SubscriptionPlanDto {
  const plan = SAAS_PLANS.find((p) => p.tier === tier);
  return plan || SAAS_PLANS[0];
}

export function changeSubscriptionPlan(
  tier: PlanTier,
  interval: BillingInterval = BillingInterval.MONTHLY
): PhotographerSubscriptionDto {
  const plan = getPlanDetails(tier);
  const now = new Date();
  const nextMonth = new Date(now);
  if (interval === BillingInterval.ANNUAL) {
    nextMonth.setFullYear(nextMonth.getFullYear() + 1);
  } else {
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }

  const updated: PhotographerSubscriptionDto = {
    id: `sub-${tier.toLowerCase()}-${Date.now().toString().slice(-4)}`,
    photographerId: 'pro-aman',
    planId: plan.id,
    tier,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: interval,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
  };

  saveStoredSubscription(updated);
  return updated;
}

export function toggleCancelSubscription(): PhotographerSubscriptionDto {
  const current = getStoredSubscription();
  const updated: PhotographerSubscriptionDto = {
    ...current,
    cancelAtPeriodEnd: !current.cancelAtPeriodEnd,
  };
  saveStoredSubscription(updated);
  return updated;
}

export function hasEntitlement(
  feature: 'hasClientCrm' | 'hasAdvancedAnalytics' | 'hasPriorityListing' | 'hasCustomGalleryBranding'
): boolean {
  const sub = getStoredSubscription();
  const plan = getPlanDetails(sub.tier);
  return Boolean(plan[feature]);
}
