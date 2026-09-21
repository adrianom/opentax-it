import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Tenant id from the `x-tenant-id` header when present (see TenantId for the mandatory variant). */
export const OptionalTenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return ctx.switchToHttp().getRequest<Request>().header('x-tenant-id') || undefined;
});
