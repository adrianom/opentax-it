import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { INPS_OFFICES, isValidInpsOfficeForGestioneSeparata } from '@opentax-it/fiscal-rules';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTenantDto } from './tenants.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTenantDto) {
    const { name, ...profile } = dto;
    if (profile.inpsOfficeCode !== undefined) {
      if (!isValidInpsOfficeForGestioneSeparata(profile.inpsOfficeCode)) throw new BadRequestException('Unknown INPS office code (see the AdE "Tabella codici sede INPS")');
      profile.inpsOfficeCode = profile.inpsOfficeCode.padStart(4, '0');
    }
    return this.prisma.tenant.create({
      data: { name, profile: { create: profile } },
      include: { profile: true },
    });
  }

  /** INPS offices accepting Gestione Separata contributions, for form selects. */
  inpsOffices() {
    return INPS_OFFICES.filter((o) => o.otherContributions).map(({ code, name }) => ({ code, name }));
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
