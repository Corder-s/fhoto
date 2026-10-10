import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rate_limit';
export interface RateLimitOptions {
  limit: number;
  ttlSeconds: number;
}

export const RateLimit = (limit: number, ttlSeconds = 60) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttlSeconds });

interface RequestRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly ipRequests: Map<string, RequestRecord> = new Map();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If endpoint doesn't declare rate limit, apply default soft limit (120 req / min)
    const limit = options?.limit || 120;
    const ttlSeconds = options?.ttlSeconds || 60;

    const request = context.switchToHttp().getRequest();
    const ip =
      (request.headers && (request.headers['x-forwarded-for'] as string)) ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const windowStart = now - ttlSeconds * 1000;

    let record = this.ipRequests.get(ip);
    if (!record) {
      record = { timestamps: [] };
      this.ipRequests.set(ip, record);
    }

    // Filter out expired timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit of ${limit} requests per ${ttlSeconds} seconds exceeded. Please slow down.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    return true;
  }
}
