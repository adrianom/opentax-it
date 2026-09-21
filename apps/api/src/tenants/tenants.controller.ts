import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { TenantId } from '../common/tenant.decorator.js';
import { CreateTenantDto, UpdateTenantProfileDto } from './tenants.dto.js';
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

  @Get('inps-offices')
  inpsOffices() {
    return this.service.inpsOffices();
  }

  @Get('me')
  me(@TenantId() tenantId: string) {
    return this.service.getWithProfile(tenantId);
  }

  @Put('me')
  updateMe(@TenantId() tenantId: string, @Body() dto: UpdateTenantProfileDto) {
    return this.service.updateProfile(tenantId, dto);
  }
}
