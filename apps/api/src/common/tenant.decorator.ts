import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Tenant identification. Resolved from the authenticated session (activeTenantId);
 * falls back to the `x-tenant-id` header for migration and testing scripts.
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const id = (req as unknown as { tenantId?: string | null }).tenantId || req.header('x-tenant-id');
  if (!id) throw new BadRequestException('Nessuna partita IVA attiva selezionata');
  return id;
});
