import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { INPS_OFFICES, isValidInpsOfficeIdForGestioneSeparata } from '@opentax-it/fiscal-rules';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTenantDto, UpdateTenantProfileDto } from './tenants.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTenantDto) {
    const { name, ...profile } = dto;
    if (profile.inpsOfficeId !== undefined && !isValidInpsOfficeIdForGestioneSeparata(profile.inpsOfficeId)) {
      throw new BadRequestException('Unknown INPS office (see the AdE "Tabella codici sede INPS")');
    }
    return this.prisma.tenant.create({
      data: { name, profile: { create: profile } },
      include: { profile: true },
    });
  }

  async updateProfile(tenantId: string, dto: UpdateTenantProfileDto) {
    await this.getWithProfile(tenantId);
    const { name, ...profile } = dto;
    if (profile.inpsOfficeId !== undefined && profile.inpsOfficeId !== '' && !isValidInpsOfficeIdForGestioneSeparata(profile.inpsOfficeId)) {
      throw new BadRequestException('Unknown INPS office (see the AdE "Tabella codici sede INPS")');
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name ? { name } : {}),
        profile: {
          update: {
            ...profile,
            inpsOfficeId: profile.inpsOfficeId === '' ? null : profile.inpsOfficeId,
            paymentIban: profile.paymentIban === '' ? null : profile.paymentIban,
            paymentBic: profile.paymentBic === '' ? null : profile.paymentBic,
          },
        },
      },
      include: { profile: true },
    });
  }

  /** INPS offices accepting Gestione Separata contributions, for form selects (one entry per published row). */
  inpsOffices() {
    return INPS_OFFICES.filter((o) => o.otherContributions).map(({ id, code, name }) => ({ id, code, name }));
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
