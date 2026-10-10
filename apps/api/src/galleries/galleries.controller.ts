import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import {
  JwtAuthGuard,
  CurrentUser,
  AuthenticatedUser,
} from '../common/auth.guard';

@Controller('galleries')
@UseGuards(JwtAuthGuard)
export class GalleriesController {
  constructor(private readonly service: GalleriesService) {}

  @Get('bookings/:bookingId')
  async getBookingGallery(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getBookingGallery(bookingId, user);
  }

  @Post('bookings/:bookingId')
  async deliverPhotoToGallery(
    @Param('bookingId') bookingId: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deliverPhotoToGallery(bookingId, body, user);
  }
}
