import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  AuthenticatedUser,
} from '../common/auth.guard';
import { RoleType, PlanTier, BillingInterval } from '@snapshoot/shared';

export class ChangePlanDto {
  tier: PlanTier;
  billingInterval?: BillingInterval;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // Public: List available plans
  @Get('plans')
  async getPlans() {
    return this.service.getPlans();
  }

  // Creator: Read current active subscription & entitlements
  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getCurrentSubscription(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getCurrentSubscription(user.photographerId);
  }

  // Creator: Request plan change
  @Post('change-plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async changePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePlanDto,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.changePlan(
      user.photographerId,
      body.tier,
      body.billingInterval || BillingInterval.MONTHLY,
    );
  }

  // Creator: Read billing receipts
  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getInvoices(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getInvoices(user.photographerId);
  }
}
