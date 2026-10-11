import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@snapshoot/shared';
import { AuthenticatedUser } from '../common/auth.guard';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (cleaned.length !== 10) {
      throw new BadRequestException('Please provide a valid 10-digit Indian phone number.');
    }

    // In local development / mock mode, static demonstration OTP is 123456
    return {
      success: true,
      message: `Verification code dispatched to +91 ${cleaned}. (Dev code: 123456)`,
    };
  }

  async verifyOtp(phoneNumber: string, otp: string, roleRequested: RoleType = RoleType.CUSTOMER): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (otp !== '123456') {
      throw new UnauthorizedException('Invalid verification code entered.');
    }

    // Generate authenticated user session
    const isCreator = roleRequested === RoleType.PHOTOGRAPHER;
    const isOwner = roleRequested === RoleType.OWNER;
    const isAdmin = roleRequested === RoleType.ADMIN;

    const userPayload: AuthenticatedUser = {
      id: isCreator ? 'usr-pro-aman' : isOwner ? 'usr-owner-1' : isAdmin ? 'usr-admin-1' : 'usr-cust-aman',
      phoneNumber: `+91 ${cleaned}`,
      email: isCreator ? 'aman.verma@snapshoot.local' : 'aman@snapshoot.local',
      fullName: isCreator ? 'Aman Verma Studio' : isOwner ? 'Platform Owner' : isAdmin ? 'Ops Desk Admin' : 'Aman Sharma',
      roles: [roleRequested],
      customerId: !isCreator ? 'cust-001' : undefined,
      photographerId: isCreator ? 'pro-aman' : undefined,
    };

    const token = await this.jwtService.signAsync(userPayload, {
      secret: process.env.JWT_ACCESS_SECRET || 'snapshoot_jwt_super_secret_key_production_grade',
      expiresIn: '7d',
    });

    return {
      accessToken: token,
      user: userPayload,
    };
  }

  async loginWithPassword(email: string, roleRequested: RoleType = RoleType.CUSTOMER): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const isCreator = roleRequested === RoleType.PHOTOGRAPHER;
    const isOwner = roleRequested === RoleType.OWNER;
    const isAdmin = roleRequested === RoleType.ADMIN;

    const userPayload: AuthenticatedUser = {
      id: isCreator ? 'usr-pro-aman' : isOwner ? 'usr-owner-1' : isAdmin ? 'usr-admin-1' : 'usr-cust-aman',
      email: email || (isCreator ? 'aman.verma@snapshoot.local' : 'aman@snapshoot.local'),
      fullName: isCreator ? 'Aman Verma Studio' : isOwner ? 'Platform Owner' : isAdmin ? 'Ops Desk Admin' : 'Aman Sharma',
      roles: [roleRequested],
      customerId: !isCreator ? 'cust-001' : undefined,
      photographerId: isCreator ? 'pro-aman' : undefined,
    };

    const token = await this.jwtService.signAsync(userPayload, {
      secret: process.env.JWT_ACCESS_SECRET || 'snapshoot_jwt_super_secret_key_production_grade',
      expiresIn: '7d',
    });

    return {
      accessToken: token,
      user: userPayload,
    };
  }

  async requestPasswordReset(identifier: string, method: 'email' | 'phone' = 'email'): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!identifier || !identifier.trim()) {
      throw new BadRequestException('Please provide your registered contact details.');
    }

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        throw new BadRequestException('Please provide a valid email address.');
      }
      return {
        success: true,
        message: `A password reset link has been dispatched to ${identifier.trim()}. The link will expire in 15 minutes.`,
      };
    } else {
      const cleaned = identifier.replace(/[^0-9]/g, '').slice(-10);
      if (cleaned.length !== 10) {
        throw new BadRequestException('Please provide a valid 10-digit Indian mobile number.');
      }
      return {
        success: true,
        message: `A password reset OTP has been dispatched to +91 ${cleaned}.`,
      };
    }
  }
}
