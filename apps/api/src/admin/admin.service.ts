import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KycApplicant {
  id: string;
  name: string;
  phone: string;
  city: string;
  idType: string;
  gear: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface OwnerAnalyticsDto {
  combinedRevenueInr: number;
  // Category 1: SaaS Subscription Revenue
  saasSubscriptions: {
    grossCollectionsInr: number;
    mrrInr: number;
    arrInr: number;
    activeSubscribersCount: number;
    newSubscribersThisMonth: number;
    cancellationsPending: number;
    refundsInr: number;
    tiers: {
      free: { creators: number; mrrInr: number };
      pro: { creators: number; mrrInr: number };
      business: { creators: number; mrrInr: number };
    };
  };
  // Category 2: Marketplace Booking Volume
  marketplaceBookings: {
    gbvInr: number;
    confirmedShootsCount: number;
    completedShootsCount: number;
    cancelledShootsCount: number;
    aovInr: number;
  };
  // Category 3: Marketplace Commission Revenue
  marketplaceCommission: {
    collectedInr: number;
    effectiveTakeRatePercent: number;
  };
  // Category 4: Photographer Payouts
  photographerPayouts: {
    totalCreatorShareInr: number;
    inEscrowPendingInr: number;
    settledPayoutsInr: number;
  };
  // Category 5: User Base & Accounts
  platformCommunity: {
    registeredCustomersCount: number;
    registeredPhotographersCount: number;
    activePhotographersCount: number;
  };
  // Backwards compatibility legacy fields
  marketplace: {
    gbvInr: number;
    commissionInr: number;
    effectiveTakeRatePercent: number;
    completedShoots: number;
    aovInr: number;
  };
  saas: {
    mrrInr: number;
    arrInr: number;
    subscribersCount: number;
    tiers: {
      free: { creators: number; mrrInr: number; commission: number };
      pro: { creators: number; mrrInr: number; commission: number };
      business: { creators: number; mrrInr: number; commission: number };
    };
  };
}

@Injectable()
export class AdminService {
  private kycQueue: Map<string, KycApplicant> = new Map([
    [
      'kyc-1',
      {
        id: 'kyc-1',
        name: 'Rajat Kapoor',
        phone: '+91 98112 34567',
        city: 'South Delhi',
        idType: 'Aadhaar Card (Masked)',
        gear: 'Sony A7 IV, 24-70 GM',
        submittedAt: '2 hours ago',
        status: 'PENDING',
      },
    ],
    [
      'kyc-2',
      {
        id: 'kyc-2',
        name: 'Shreya Goswami',
        phone: '+91 97234 56789',
        city: 'Bandra, Mumbai',
        idType: 'Passport (First/Last page)',
        gear: 'Canon R6 II, 70-200 L',
        submittedAt: '4 hours ago',
        status: 'PENDING',
      },
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async getKycQueue(): Promise<KycApplicant[]> {
    return Array.from(this.kycQueue.values());
  }

  async reviewKyc(id: string, action: 'APPROVE' | 'REJECT'): Promise<KycApplicant> {
    const applicant = this.kycQueue.get(id);
    if (!applicant) {
      throw new NotFoundException(`KYC applicant '${id}' not found.`);
    }

    const updated: KycApplicant = {
      ...applicant,
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    };
    this.kycQueue.set(id, updated);
    return updated;
  }

  // Authoritative Platform Owner Analytics (strictly segregates 5 financial categories)
  async getOwnerAnalytics(): Promise<OwnerAnalyticsDto> {
    const gbv = 1845000;
    const marketplaceCommission = 369000; // 20%
    const creatorNetShare = gbv - marketplaceCommission; // 1476000 (80%)
    const inEscrow = 48000;
    const settledPayouts = creatorNetShare - inEscrow; // 1428000
    const saasMrr = 589730;
    const saasArr = saasMrr * 12;

    return {
      combinedRevenueInr: marketplaceCommission + saasMrr, // ₹9,58,730
      saasSubscriptions: {
        grossCollectionsInr: saasMrr,
        mrrInr: saasMrr,
        arrInr: saasArr,
        activeSubscribersCount: 270,
        newSubscribersThisMonth: 35,
        cancellationsPending: 8,
        refundsInr: 0,
        tiers: {
          free: { creators: 180, mrrInr: 0 },
          pro: { creators: 245, mrrInr: 489755 },
          business: { creators: 25, mrrInr: 99975 },
        },
      },
      marketplaceBookings: {
        gbvInr: gbv,
        confirmedShootsCount: 324,
        completedShootsCount: 312,
        cancelledShootsCount: 12,
        aovInr: 5910,
      },
      marketplaceCommission: {
        collectedInr: marketplaceCommission,
        effectiveTakeRatePercent: 20.0,
      },
      photographerPayouts: {
        totalCreatorShareInr: creatorNetShare,
        inEscrowPendingInr: inEscrow,
        settledPayoutsInr: settledPayouts,
      },
      platformCommunity: {
        registeredCustomersCount: 1420,
        registeredPhotographersCount: 450,
        activePhotographersCount: 312,
      },
      // Backwards-compatible fields
      marketplace: {
        gbvInr: gbv,
        commissionInr: marketplaceCommission,
        effectiveTakeRatePercent: 20.0,
        completedShoots: 312,
        aovInr: 5910,
      },
      saas: {
        mrrInr: saasMrr,
        arrInr: saasArr,
        subscribersCount: 270,
        tiers: {
          free: { creators: 180, mrrInr: 0, commission: 25 },
          pro: { creators: 245, mrrInr: 489755, commission: 20 },
          business: { creators: 25, mrrInr: 99975, commission: 15 },
        },
      },
    };
  }
}
