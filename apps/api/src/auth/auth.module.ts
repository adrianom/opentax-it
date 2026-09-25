import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { RateLimiterService } from './rate-limiter.service.js';
import { RolesGuard } from './roles.guard.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    RateLimiterService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    RateLimiterService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
