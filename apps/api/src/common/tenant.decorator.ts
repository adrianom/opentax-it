import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Tenant identification. Until authentication is implemented the tenant is taken
 * from the `x-tenant-id` header; with auth it will come from the session/JWT.
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const id = req.header('x-tenant-id');
  if (!id) throw new BadRequestException('Missing x-tenant-id header');
  return id;
});
