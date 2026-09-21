import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTenantDto } from './tenants.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTenantDto) {
    const { name, ...profile } = dto;
    return this.prisma.tenant.create({
      data: { name, profile: { create: profile } },
      include: { profile: true },
    });
  }

  async getWithProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { profile: true } });
    if (!tenant?.profile) throw new NotFoundException(`Tenant ${tenantId} not found or without a fiscal profile`);
    return { ...tenant, profile: tenant.profile };
  }

  list() {
    return this.prisma.tenant.findMany({ select: { id: true, name: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
  }
}
