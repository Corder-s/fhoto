import { Controller, Get } from '@nestjs/common';
import { Public } from './auth.guard';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'snapshoot-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
    };
  }
}
