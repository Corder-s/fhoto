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

  async getOwnerAnalytics() {
    return {
      combinedRevenueInr: 958730,
      marketplace: {
        gbvInr: 1845000,
        commissionInr: 369000,
        effectiveTakeRatePercent: 20.0,
        completedShoots: 312,
        aovInr: 5910,
      },
      saas: {
        mrrInr: 589730,
        arrInr: 7076760,
        subscribersCount: 305,
        tiers: {
          free: { creators: 180, mrrInr: 0, commission: 25 },
          pro: { creators: 245, mrrInr: 489755, commission: 20 },
          business: { creators: 25, mrrInr: 99975, commission: 15 },
        },
      },
    };
  }
}
