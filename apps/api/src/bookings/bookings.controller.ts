import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  JwtAuthGuard,
  CurrentUser,
  AuthenticatedUser,
} from '../common/auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get('my-bookings')
  async getMyBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyBookings(user);
  }

  @Get(':id')
  async getBookingById(
    @Param('id') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getBookingById(bookingId, user);
  }

  @Post(':id/verify-otp')
  async verifyArrivalOtp(
    @Param('id') bookingId: string,
    @Body() body: { otp: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.verifyArrivalOtp(bookingId, body.otp, user);
  }

  @Post(':id/cancel')
  async cancelBooking(
    @Param('id') bookingId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelBooking(bookingId, body.reason || 'Client cancellation', user);
  }
}
