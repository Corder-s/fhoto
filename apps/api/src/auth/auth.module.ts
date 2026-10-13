import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard, RolesGuard } from '../common/auth.guard';
import { EntitlementGuard } from '../common/entitlement.guard';
import { getJwtSecret } from './auth-config';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, EntitlementGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard, EntitlementGuard],
})
export class AuthModule {}
