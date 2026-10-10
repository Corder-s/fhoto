import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './ai.dto';
import { AuthenticatedUser, Public } from '../common/auth.guard';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService,
  ) {}

  @Public() // Accessible to customers/visitors and authenticated creators
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async chat(@Body() dto: ChatRequestDto, @Req() req: Request): Promise<ChatResponseDto> {
    // Extract optional authenticated session from Bearer token or cookie
    let user: AuthenticatedUser | undefined;

    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieHeader) {
      const match = cookieHeader.match(/snapshoot_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'snapshoot_jwt_super_secret_key_production_grade',
        });
        user = payload as AuthenticatedUser;
      } catch {
        // Invalid or expired token: fall back to unauthenticated customer visitor
        user = undefined;
      }
    }

    return await this.aiService.chat(dto, user);
  }
}
