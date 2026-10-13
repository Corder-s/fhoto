import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PhotographersService } from './photographers.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  AuthenticatedUser,
} from '../common/auth.guard';
import { RoleType } from '@snapshoot/shared';

@Controller()
export class PhotographersController {
  constructor(private readonly service: PhotographersService) {}

  // ==========================================
  // PUBLIC DISCOVERY CATALOG ENDPOINTS
  // ==========================================

  @Get('photographers')
  async getPublicPhotographers(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.service.getPublicPhotographers(city, category);
  }

  @Get('photographers/:id')
  async getPublicPhotographerById(@Param('id') id: string) {
    return this.service.getPublicPhotographerById(id);
  }

  // ==========================================
  // CREATOR BUSINESS MANAGEMENT ENDPOINTS
  // ==========================================

  @Get('photographer/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getMyBusinessProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getMyBusinessProfile(user.photographerId);
  }

  @Put('photographer/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async updateMyBusinessProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.updateMyBusinessProfile(user.photographerId, body);
  }

  @Get('photographer/packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getMyPackages(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getMyPackages(user.photographerId);
  }

  @Post('photographer/packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async createPackage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.createPackage(user.photographerId, body);
  }

  @Put('photographer/packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async updatePackage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') packageId: string,
    @Body() body: any,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.updatePackage(user.photographerId, packageId, body);
  }

  @Delete('photographer/packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async deletePackage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') packageId: string,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.deletePackage(user.photographerId, packageId);
  }

  @Get('photographer/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async getMyAvailability(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getMyAvailability(user.photographerId);
  }

  @Put('photographer/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PHOTOGRAPHER)
  async setMyAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { slots: any[] },
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.setMyAvailability(user.photographerId, body.slots || []);
  }
}
