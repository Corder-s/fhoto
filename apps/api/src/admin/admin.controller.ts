import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '../common/auth.guard';
import { RoleType } from '@snapshoot/shared';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('admin/kyc-queue')
  @Roles(RoleType.ADMIN, RoleType.OWNER)
  async getKycQueue() {
    return this.service.getKycQueue();
  }

  @Post('admin/kyc/:id/review')
  @Roles(RoleType.ADMIN, RoleType.OWNER)
  async reviewKyc(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT' },
  ) {
    return this.service.reviewKyc(id, body.action || 'APPROVE');
  }

  @Get('owner/analytics')
  @Roles(RoleType.OWNER)
  async getOwnerAnalytics() {
    return this.service.getOwnerAnalytics();
  }
}
