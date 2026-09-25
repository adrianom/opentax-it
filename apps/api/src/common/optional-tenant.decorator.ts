import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Tenant id from the session or `x-tenant-id` header when present (see TenantId for the mandatory variant). */
export const OptionalTenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return (req as unknown as { tenantId?: string | null }).tenantId || req.header('x-tenant-id') || undefined;
});
