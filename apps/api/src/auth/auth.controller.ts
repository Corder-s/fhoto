import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../common/auth.guard';
import { RoleType } from '@snapshoot/shared';

export class RequestOtpDto {
  phoneNumber: string;
}

export class VerifyOtpDto {
  phoneNumber: string;
  otp: string;
  role?: RoleType;
}

export class LoginDto {
  email: string;
  password?: string;
  role?: RoleType;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.phoneNumber, body.otp, body.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.loginWithPassword(body.email, body.role);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      authenticated: true,
      user,
    };
  }
}
