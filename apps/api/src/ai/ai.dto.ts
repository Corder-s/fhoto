import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryItemDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}

export interface ChatResponseDto {
  success: boolean;
  isConfigured: boolean;
  reply: string;
  assistantRole: 'CUSTOMER' | 'PHOTOGRAPHER';
  toolsUsed?: string[];
  suggestions?: string[];
  error?: string;
  confirmationRequired?: {
    action: string;
    description: string;
    params: Record<string, any>;
  };
}
