import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  AuthenticatedUser,
} from '../common/auth.guard';
import { EntitlementGuard } from '../common/entitlement.guard';
import { RequireEntitlement } from '../common/auth.guard';
import { RoleType } from '@snapshoot/shared';

@Controller('photographer/clients')
@UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
@Roles(RoleType.PHOTOGRAPHER)
@RequireEntitlement('hasClientCrm')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  async getMyClients(@CurrentUser() user: AuthenticatedUser) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getMyClients(user.photographerId);
  }

  @Post()
  async createClient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.createClient(user.photographerId, body);
  }

  @Get(':id')
  async getClientById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') clientId: string,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.getClientById(user.photographerId, clientId);
  }

  @Put(':id')
  async updateClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') clientId: string,
    @Body() body: any,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.updateClient(user.photographerId, clientId, body);
  }

  @Delete(':id')
  async deleteClient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') clientId: string,
  ) {
    if (!user.photographerId) {
      throw new ForbiddenException('Photographer business account required.');
    }
    return this.service.deleteClient(user.photographerId, clientId);
  }
}
