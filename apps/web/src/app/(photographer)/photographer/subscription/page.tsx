'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Shield,
  ArrowRight,
  Zap,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  PlanTier,
  BillingInterval,
  SubscriptionPlanDto,
  PhotographerSubscriptionDto,
  SAAS_PLANS
} from '@snapshoot/shared';
import {
  getStoredSubscription,
  changeSubscriptionPlan,
  toggleCancelSubscription,
  getPlanDetails
} from '../../../../lib/subscriptionService';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Card } from '../../../../components/ui/Card';

export default function PhotographerSubscriptionPage() {
  const [subscription, setSubscription] = useState<PhotographerSubscriptionDto>(getStoredSubscription);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.MONTHLY);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<SubscriptionPlanDto | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState('');

  useEffect(() => {
    const handleSubChange = () => {
      setSubscription(getStoredSubscription());
    };
    window.addEventListener('snapshoot:subscription-change', handleSubChange);
    return () => window.removeEventListener('snapshoot:subscription-change', handleSubChange);
  }, []);

  const currentPlan = getPlanDetails(subscription.tier);

  const handleSelectPlan = (plan: SubscriptionPlanDto) => {
    if (plan.tier === subscription.tier) return;
    setSelectedPlanForModal(plan);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPlanChange = () => {
    if (!selectedPlanForModal) return;
    const updated = changeSubscriptionPlan(selectedPlanForModal.tier, billingInterval);
    setSubscription(updated);
    setIsConfirmModalOpen(false);
    setStatusNotification(
      `Plan successfully updated to ${selectedPlanForModal.name}! Your new features and entitlements are active immediately.`
    );
    setTimeout(() => setStatusNotification(''), 5000);
  };

  const handleToggleCancel = () => {
    const updated = toggleCancelSubscription();
    setSubscription(updated);
    setIsCancelModalOpen(false);
    setStatusNotification(
      updated.cancelAtPeriodEnd
        ? 'Subscription cancellation scheduled for the end of the current billing cycle.'
        : 'Subscription renewal reinstated successfully.'
    );
    setTimeout(() => setStatusNotification(''), 5000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF6E00] bg-[#FFF4EB] px-2.5 py-0.5 rounded-full border border-[#FFD9B3]">
              Creator Studio SaaS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1816] tracking-tight mt-1">
            Subscription Plans & Business Entitlements
          </h1>
          <p className="text-xs sm:text-sm text-[#665E55] mt-1 max-w-2xl">
            Choose the tier that fits your photography business. Scale your portfolio, access client CRM tools, and gain priority marketplace visibility.
          </p>
        </div>

        {/* Current Plan Badge Card */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1D6] shadow-sm flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF4EB] text-[#FF6E00] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8C847A]">Active Plan</div>
            <div className="text-sm font-black text-[#1A1816] flex items-center gap-1.5">
              <span>{currentPlan.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscription Overview Card */}
      <div className="p-6 bg-gradient-to-br from-white to-[#FAF7F2] rounded-3xl border border-[#E8E1D6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EAE1]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#1A1816]">{currentPlan.name} Membership</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {subscription.status}
              </span>
            </div>
            <p className="text-xs text-[#665E55]">{currentPlan.tagline}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-[#8C847A]">Current Cycle Renews On</p>
            <p className="text-sm font-extrabold text-[#1A1816]">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Active Entitlements Summary Pill Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-white rounded-2xl border border-[#EDE6DC]">
            <p className="text-[10px] font-bold text-[#8C847A] uppercase">Portfolio Limit</p>
            <p className="text-base font-black text-[#1A1816] mt-0.5">{currentPlan.maxPortfolioItems} Photos</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#EDE6DC]">
            <p className="text-[10px] font-bold text-[#8C847A] uppercase">Service Packages</p>
            <p className="text-base font-black text-[#1A1816] mt-0.5">{currentPlan.maxServicePackages} Tiers</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#EDE6DC]">
            <p className="text-[10px] font-bold text-[#8C847A] uppercase">Client CRM</p>
            <p className="text-base font-black text-[#1A1816] mt-0.5">
              {currentPlan.hasClientCrm ? 'Included ✓' : 'Upgrade Required'}
            </p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#EDE6DC]">
            <p className="text-[10px] font-bold text-[#8C847A] uppercase">Search Radar</p>
            <p className="text-base font-black text-[#1A1816] mt-0.5">
              {currentPlan.hasPriorityListing ? 'Priority Boost ★' : 'Standard'}
            </p>
          </div>
        </div>

        {/* Cancellation Notice if active */}
        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
            <span>
              Your plan will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. You will revert to Starter Creator afterwards.
            </span>
            <button
              onClick={handleToggleCancel}
              className="text-xs font-bold text-[#FF6E00] hover:underline"
            >
              Resume Auto-Renewal
            </button>
          </div>
        )}
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-2">
        <div className="inline-flex items-center p-1 bg-[#F2ECE3] rounded-full border border-[#E5DDD2]">
          <button
            type="button"
            onClick={() => setBillingInterval(BillingInterval.MONTHLY)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              billingInterval === BillingInterval.MONTHLY
                ? 'bg-white text-[#1A1816] shadow-sm'
                : 'text-[#665E55] hover:text-[#1A1816]'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval(BillingInterval.ANNUAL)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingInterval === BillingInterval.ANNUAL
                ? 'bg-white text-[#1A1816] shadow-sm'
                : 'text-[#665E55] hover:text-[#1A1816]'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF6E00] text-white">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SAAS_PLANS.map((plan) => {
          const isCurrent = subscription.tier === plan.tier;
          const price =
            billingInterval === BillingInterval.ANNUAL
              ? plan.priceAnnualInr
              : plan.priceMonthlyInr;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'border-2 border-[#FF6E00] shadow-card ring-4 ring-[#FF6E00]/10'
                  : 'border border-[#E8E1D6] shadow-subtle hover:border-[#D5CEC4]'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF6E00] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-black text-[#1A1816]">{plan.name}</h3>
                  <p className="text-xs text-[#665E55] mt-1 leading-relaxed min-h-[36px]">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pb-4 border-b border-[#F0EAE1]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#1A1816]">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-[#8C847A]">
                      {plan.priceMonthlyInr === 0
                        ? '/ forever'
                        : billingInterval === BillingInterval.ANNUAL
                        ? '/ year'
                        : '/ month'}
                    </span>
                  </div>
                  {billingInterval === BillingInterval.ANNUAL && plan.priceMonthlyInr > 0 && (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      Equivalent to ₹{Math.round(plan.priceAnnualInr / 12)}/month
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C847A]">
                    Plan Features & Limits
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#332E29]">
                        <Check className="w-4 h-4 text-[#FF6E00] shrink-0 mt-0.5 stroke-[2.5]" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-[#F0EAE1]">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-full text-xs font-bold bg-[#F2ECE3] text-[#8C847A] cursor-default border border-[#E5DDD2]"
                  >
                    ✓ Current Plan Active
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                      plan.isPopular
                        ? 'bg-[#FF6E00] hover:bg-[#E86300] text-white active:scale-98'
                        : 'bg-[#1A1816] hover:bg-black text-white active:scale-98'
                    }`}
                  >
                    <span>Switch to {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="bg-white rounded-3xl border border-[#E8E1D6] p-6 sm:p-8 shadow-subtle space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#1A1816]">Comprehensive Feature Matrix</h2>
          <p className="text-xs text-[#665E55] mt-1">
            Compare resource allowances and business capabilities across all plans.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E1D6] text-[#8C847A] uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Feature / Capability</th>
                <th className="py-3 px-4 text-center">Starter</th>
                <th className="py-3 px-4 text-center bg-[#FFF9F3] text-[#FF6E00]">Pro Studio</th>
                <th className="py-3 px-4 text-center">Business Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Max Portfolio Showcase Photos</td>
                <td className="py-3 px-4 text-center text-[#5A544D]">10 Photos</td>
                <td className="py-3 px-4 text-center font-bold text-[#FF6E00] bg-[#FFF9F3]">50 Photos</td>
                <td className="py-3 px-4 text-center font-bold text-[#1A1816]">250 Photos</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Service Packages & Pricing Tiers</td>
                <td className="py-3 px-4 text-center text-[#5A544D]">2 Packages</td>
                <td className="py-3 px-4 text-center font-bold text-[#FF6E00] bg-[#FFF9F3]">6 Packages</td>
                <td className="py-3 px-4 text-center font-bold text-[#1A1816]">20 Packages</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Client Management (CRM) Directory</td>
                <td className="py-3 px-4 text-center text-[#8C847A]">—</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-[#FFF9F3]">Included ✓</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">Included ✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Priority Marketplace Search Radar</td>
                <td className="py-3 px-4 text-center text-[#8C847A]">Standard</td>
                <td className="py-3 px-4 text-center font-bold text-[#FF6E00] bg-[#FFF9F3]">Priority 2x</td>
                <td className="py-3 px-4 text-center font-bold text-[#1A1816]">Featured Top Tier</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Advanced Revenue Analytics & Retention</td>
                <td className="py-3 px-4 text-center text-[#8C847A]">—</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-[#FFF9F3]">Included ✓</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">Included ✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Custom Watermark & Client Gallery Branding</td>
                <td className="py-3 px-4 text-center text-[#8C847A]">—</td>
                <td className="py-3 px-4 text-center text-[#8C847A] bg-[#FFF9F3]">—</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">Included ✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1A1816]">Instant UPI Payout Fee Waiver</td>
                <td className="py-3 px-4 text-center text-[#8C847A]">Standard</td>
                <td className="py-3 px-4 text-center text-[#5A544D] bg-[#FFF9F3]">Standard</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">100% Free Waivers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription FAQ & Guarantee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-5 bg-white rounded-2xl border border-[#E8E1D6] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1816]">
            <Zap className="w-4 h-4 text-[#FF6E00]" />
            <span>Instant Entitlements</span>
          </div>
          <p className="text-[11px] text-[#665E55] leading-relaxed">
            Upgrading your tier immediately unlocks higher portfolio quotas and client CRM workspaces.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8E1D6] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1816]">
            <Shield className="w-4 h-4 text-[#FF6E00]" />
            <span>Cancel Anytime</span>
          </div>
          <p className="text-[11px] text-[#665E55] leading-relaxed">
            Switch plans or cancel auto-renewal with one click. Retain all benefits until your billing period ends.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8E1D6] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1816]">
            <CreditCard className="w-4 h-4 text-[#FF6E00]" />
            <span>Secure Indian Payments</span>
          </div>
          <p className="text-[11px] text-[#665E55] leading-relaxed">
            Support for UPI AutoPay, Rupay, Mastercard, Visa, and business NetBanking with instant GST invoices.
          </p>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {selectedPlanForModal && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Confirm Subscription Change`}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#665E55] leading-relaxed">
              You are switching from <strong>{currentPlan.name}</strong> to{' '}
              <strong>{selectedPlanForModal.name}</strong> with{' '}
              <strong>{billingInterval.toLowerCase()}</strong> billing.
            </p>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E1D6] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8C847A]">New Plan:</span>
                <span className="font-bold text-[#1A1816]">{selectedPlanForModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C847A]">Billing Cycle:</span>
                <span className="font-bold text-[#1A1816]">
                  {billingInterval === BillingInterval.ANNUAL ? 'Annual (12 Months)' : 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#EDE6DC] pt-2">
                <span className="font-bold text-[#1A1816]">Amount Due:</span>
                <span className="font-black text-[#FF6E00] text-sm">
                  ₹{billingInterval === BillingInterval.ANNUAL
                    ? selectedPlanForModal.priceAnnualInr.toLocaleString('en-IN')
                    : selectedPlanForModal.priceMonthlyInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EAE1]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPlanChange}
              >
                Confirm & Activate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
