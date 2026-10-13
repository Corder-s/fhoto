import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard, RolesGuard } from '../common/auth.guard';
import { EntitlementGuard } from '../common/entitlement.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'snapshoot_jwt_super_secret_key_production_grade',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, EntitlementGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard, EntitlementGuard],
})
export class AuthModule {}
