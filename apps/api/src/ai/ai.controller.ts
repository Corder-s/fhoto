import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './ai.dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../common/auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatResponseDto> {
    if (!user) {
      throw new UnauthorizedException('Authentication required to access SnapShoot AI Assistant.');
    }
    return await this.aiService.chat(dto, user);
  }
}
