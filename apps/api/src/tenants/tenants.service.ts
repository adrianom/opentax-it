import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { INPS_OFFICES, isValidInpsOfficeIdForGestioneSeparata } from '@opentax-it/fiscal-rules';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BankAccountDto, CreateTenantDto, PaymentTermsDto, UpdateTenantProfileDto } from './tenants.dto.js';

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
          },
        },
      },
      include: { profile: true },
    });
  }

  listBankAccounts(tenantId: string) {
    return this.prisma.bankAccount.findMany({ where: { tenantId }, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
  }

  async saveBankAccount(tenantId: string, dto: BankAccountDto, id?: string) {
    const { name, bankName, iban, bic, isDefault } = dto;
    const data = { name, bankName: bankName || null, iban, bic: bic || null, isDefault: isDefault ?? false };
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await tx.bankAccount.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
      if (id) {
        const existing = await tx.bankAccount.findFirst({ where: { id, tenantId } });
        if (!existing) throw new NotFoundException(`Bank account ${id} not found`);
        return tx.bankAccount.update({ where: { id }, data });
      }
      return tx.bankAccount.create({ data: { tenantId, ...data } });
    });
  }

  async deleteBankAccount(tenantId: string, id: string) {
    const existing = await this.prisma.bankAccount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`Bank account ${id} not found`);
    const used = await this.prisma.invoice.count({ where: { bankAccountId: id } });
    if (used) throw new BadRequestException('Bank account is used by invoices and cannot be deleted');
    await this.prisma.bankAccount.delete({ where: { id } });
  }

  listPaymentTerms(tenantId: string) {
    return this.prisma.paymentTerms.findMany({ where: { tenantId }, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
  }

  async savePaymentTerms(tenantId: string, dto: PaymentTermsDto, id?: string) {
    const { name, days, method, isDefault } = dto;
    const data = { name, days, method: method ?? 'MP05', isDefault: isDefault ?? false };
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await tx.paymentTerms.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
      if (id) {
        const existing = await tx.paymentTerms.findFirst({ where: { id, tenantId } });
        if (!existing) throw new NotFoundException(`Payment terms ${id} not found`);
        return tx.paymentTerms.update({ where: { id }, data });
      }
      return tx.paymentTerms.create({ data: { tenantId, ...data } });
    });
  }

  async deletePaymentTerms(tenantId: string, id: string) {
    const existing = await this.prisma.paymentTerms.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`Payment terms ${id} not found`);
    await this.prisma.paymentTerms.delete({ where: { id } });
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
