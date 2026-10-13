import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ENTITLEMENT_KEY, AuthenticatedUser } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLANS, PlanTier } from '@snapshoot/shared';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredEntitlement = this.reflector.getAllAndOverride<string>(
      REQUIRE_ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredEntitlement) {
      return true;
    }

    const { user }: { user: AuthenticatedUser } = context.switchToHttp().getRequest();
    if (!user || !user.photographerId) {
      throw new ForbiddenException('Creator profile required to access SaaS entitlements.');
    }

    let tier: PlanTier = PlanTier.PRO; // Default to PRO if offline or unseeded

    try {
      const sub = await this.prisma.photographerSubscription.findUnique({
        where: { photographerId: user.photographerId },
        include: { plan: true },
      });

      if (sub && sub.plan) {
        tier = sub.plan.tier as unknown as PlanTier;
      }
    } catch (err) {
      // Offline fallback: allow default tier
    }

    const planConfig = SAAS_PLANS.find((p) => p.tier === tier) || SAAS_PLANS[1];

    if (requiredEntitlement === 'hasClientCrm' && !planConfig.hasClientCrm) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'PLAN_UPGRADE_REQUIRED',
        message: 'Client CRM & directory requires Pro Studio or Business plan upgrade.',
        requiredTier: 'PRO',
      });
    }

    if (requiredEntitlement === 'hasAdvancedAnalytics' && !planConfig.hasAdvancedAnalytics) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'PLAN_UPGRADE_REQUIRED',
        message: 'Advanced Business Analytics requires Pro Studio or Business plan upgrade.',
        requiredTier: 'PRO',
      });
    }

    return true;
  }
}
