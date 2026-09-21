import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator.js';
import { CreateTenantDto } from './tenants.dto.js';
import { TenantsService } from './tenants.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get('me')
  me(@TenantId() tenantId: string) {
    return this.service.getWithProfile(tenantId);
  }
}
