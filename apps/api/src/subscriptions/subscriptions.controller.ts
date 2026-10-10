import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SubscriptionsService,
  VerifyCheckoutDto,
} from './subscriptions.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  AuthenticatedUser,
  Public,
} from '../common/auth.guard';
import { RoleType, PlanTier, BillingInterval } from '@snapshoot/shared';

export class CreateCheckoutSessionDto {
  tier: PlanTier;
  billingInterval?: BillingInterval;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // 1. Public: List available plans
  @Public()
  @Get('plans')
  async getPlans() {
    return this.service.getPlans();
  }

  // 2. Creator: Read current active subscription & entitlements
  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getCurrentSubscription(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getCurrentSubscription(user.photographerId);
  }

  // 3. Creator: Initiate Checkout Session
  @Post('checkout-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCheckoutSessionDto,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    if (!body.tier) {
      throw new BadRequestException('Target plan tier is required.');
    }
    return this.service.createCheckoutSession(
      user.photographerId,
      body.tier,
      body.billingInterval || BillingInterval.MONTHLY,
    );
  }

  // 4. Creator: Cryptographic Payment Verification & Activation
  @Post('verify-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async verifyCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: VerifyCheckoutDto,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.verifyCheckout(user.photographerId, body);
  }

  // 5. Creator: Toggle Auto-Renewal Cancellation
  @Post('toggle-cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async toggleCancel(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.toggleCancelSubscription(user.photographerId);
  }

  // 6. Creator: Read billing receipts & invoice history
  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getInvoices(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getInvoices(user.photographerId);
  }

  // 7. Public Webhook: Verified Razorpay Webhook Endpoint
  @Public()
  @Post('webhook')
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing x-razorpay-signature header.');
    }
    return this.service.processWebhook(body, signature);
  }
}
