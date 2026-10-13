import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../common/auth.guard';
import { getJwtSecret, MOCK_TOKEN_TTL, requireMockAuth } from './auth-config';

/**
 * Development-only mock authentication for the NestJS API.
 *
 * Every method first calls requireMockAuth(), so these endpoints are unavailable
 * unless ENABLE_MOCK_AUTH=true outside production. Even then:
 *  - the role can only be CUSTOMER or PHOTOGRAPHER (ADMIN/OWNER are never minted from a request);
 *  - the OTP is not echoed back in responses;
 *  - tokens expire after MOCK_TOKEN_TTL and are signed with getJwtSecret().
 * Password reset is not implemented here; the web app uses Supabase Auth for it.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private static readonly MOCK_OTP = '123456';

  private static assertMockRole(role: RoleType): void {
    if (role !== RoleType.CUSTOMER && role !== RoleType.PHOTOGRAPHER) {
      throw new ForbiddenException('Only customer and photographer sessions can be created here.');
    }
  }

  private async issueMockToken(
    roleRequested: RoleType,
    identity: { email?: string; phoneNumber?: string },
  ): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    AuthService.assertMockRole(roleRequested);
    const isCreator = roleRequested === RoleType.PHOTOGRAPHER;

    const userPayload: AuthenticatedUser = {
      id: isCreator ? 'usr-pro-aman' : 'usr-cust-aman',
      phoneNumber: identity.phoneNumber,
      email: identity.email || (isCreator ? 'aman.verma@snapshoot.local' : 'aman@snapshoot.local'),
      fullName: isCreator ? 'Aman Verma Studio' : 'Aman Sharma',
      roles: [roleRequested],
      customerId: !isCreator ? 'cust-001' : undefined,
      photographerId: isCreator ? 'pro-aman' : undefined,
    };

    const token = await this.jwtService.signAsync(userPayload, {
      secret: getJwtSecret(),
      expiresIn: MOCK_TOKEN_TTL,
    });

    return { accessToken: token, user: userPayload };
  }

  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    requireMockAuth();
    const cleaned = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (cleaned.length !== 10) {
      throw new BadRequestException('Please provide a valid 10-digit Indian phone number.');
    }
    // The code is never returned to the caller.
    return { success: true, message: 'Verification code sent.' };
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
    roleRequested: RoleType = RoleType.CUSTOMER,
  ): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    requireMockAuth();
    const cleaned = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (otp !== AuthService.MOCK_OTP) {
      throw new UnauthorizedException('Invalid verification code entered.');
    }
    return this.issueMockToken(roleRequested, { phoneNumber: `+91 ${cleaned}` });
  }

  async loginWithPassword(
    email: string,
    roleRequested: RoleType = RoleType.CUSTOMER,
  ): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    requireMockAuth();
    return this.issueMockToken(roleRequested, { email: email || undefined });
  }

  async requestPasswordReset(_identifier: string, _method: 'email' | 'phone' = 'email'): Promise<never> {
    throw new NotImplementedException(
      'Password reset is handled by Supabase Auth in the web application (/forgot-password).',
    );
  }
}
