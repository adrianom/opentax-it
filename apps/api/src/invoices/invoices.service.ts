import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { buildInvoiceXml, invoiceFileName, type FlatRateInvoice } from '@opentax-it/fatturapa';
import type { FiscalRuleSet } from '@opentax-it/fiscal-rules';
import { FiscalRulesService } from '../fiscal-rules/fiscal-rules.service.js';
import type { Customer, Invoice, InvoiceLine, TenantProfile } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import type { CreateInvoiceDto, ListInvoicesQuery, UpdateInvoiceDto } from './invoices.dto.js';

/**
 * Invoices under the flat-rate regime.
 *
 * - No VAT is charged (L. 190/2014 art. 1 par. 58 lett. a); lines carry Natura N2.2 for
 *   domestic operations and N2.1 for art. 7-ter operations with non-resident customers
 *   (par. 58 lett. d); DPR 633/72 art. 21 par. 6-bis annotations).
 * - Mandatory notes: flat-rate regime (par. 54-89) and no withholding (par. 67) — AdE
 *   e-invoice guide, December 2025.
 * - Stamp duty EUR 2 when non-subject operations exceed EUR 77.47 (DM 17/06/2014 art. 6;
 *   AdE stamp duty guide), included in the document total.
 * - Optional 4% INPS surcharge (L. 662/1996 art. 1 par. 212) exposed as DatiCassaPrevidenziale TC22.
 * - Numbering: progressive per year and document type; the issue date must be within
 *   12 days of the operation (DPR 633/72 art. 21 par. 4) — enforced by the caller's date.
 *
 * All thresholds/rates/texts come from the ACTIVE FiscalRuleSet of the invoice year.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type InvoiceWithRelations = Invoice & { lines: InvoiceLine[]; customer: Customer };

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: FiscalRulesService,
    private readonly tenants: TenantsService,
    private readonly storage: StorageService,
  ) {}

  list(tenantId: string, q: ListInvoicesQuery) {
    return this.prisma.invoice.findMany({
      where: { tenantId, ...(q.year ? { year: q.year } : {}), ...(q.status ? { status: q.status as Invoice['status'] } : {}) },
      include: { customer: { select: { id: true, businessName: true, firstName: true, lastName: true, kind: true } } },
      orderBy: [{ date: 'desc' }, { sequence: 'desc' }],
    });
  }

  async get(tenantId: string, id: string): Promise<InvoiceWithRelations> {
    const inv = await this.prisma.invoice.findFirst({ where: { id, tenantId }, include: { lines: { orderBy: { lineNumber: 'asc' } }, customer: true } });
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  /** Compute derived amounts and texts from the DTO, the customer and the active rule set. */
  private async prepare(tenantId: string, dto: CreateInvoiceDto) {
    const year = Number(dto.date.slice(0, 4));
    const rules = await this.rules.getActive(year);
    const { profile } = await this.tenants.getWithProfile(tenantId);
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
    if (!customer) throw new BadRequestException(`Customer ${dto.customerId} not found`);

    const type = dto.type ?? 'TD01';
    if ((type === 'TD04' || type === 'TD05') && !dto.refInvoiceId) throw new BadRequestException('Credit/debit notes require refInvoiceId');
    if (dto.refInvoiceId) {
      const ref = await this.prisma.invoice.findFirst({ where: { id: dto.refInvoiceId, tenantId } });
      if (!ref) throw new BadRequestException(`Referenced invoice ${dto.refInvoiceId} not found`);
    }

    const lines = dto.lines.map((l, i) => {
      const quantity = l.quantity ?? 1;
      return { lineNumber: i + 1, description: l.description, quantity, unit: l.unit ?? null, unitPrice: l.unitPrice, totalPrice: round2(quantity * l.unitPrice) };
    });
    const linesTotal = round2(lines.reduce((s, l) => s + l.totalPrice, 0));

    const applySurcharge = dto.applyInpsSurcharge ?? profile.applyInpsSurcharge;
    const inpsSurcharge = applySurcharge ? round2((linesTotal * rules.inps.surchargePct) / 100) : 0;

    const foreign = customer.kind === 'EU' || customer.kind === 'NON_EU';
    const vatNature = foreign ? 'N2_1' : 'N2_2';

    // Stamp duty applies when the total of non-subject operations exceeds the threshold (fund contribution included).
    const nonSubjectTotal = round2(linesTotal + inpsSurcharge);
    const virtualStamp = nonSubjectTotal > rules.stampDuty.threshold;
    const stampAmount = virtualStamp ? rules.stampDuty.amount : 0;
    const total = round2(nonSubjectTotal + stampAmount);

    const notes = [rules.eInvoice.regimeNote, rules.eInvoice.noWithholdingNote];
    if (customer.kind === 'EU') notes.push(rules.eInvoice.euAnnotation);
    if (customer.kind === 'NON_EU') notes.push(rules.eInvoice.nonEuAnnotation);

    return {
      rules,
      profile,
      customer,
      data: {
        customerId: customer.id,
        type,
        year,
        date: new Date(`${dto.date}T00:00:00Z`),
        currency: dto.currency ?? customer.currency,
        exchangeRate: dto.exchangeRate ?? 1,
        vatNature: vatNature as Invoice['vatNature'],
        taxableAmount: linesTotal,
        inpsSurcharge,
        virtualStamp,
        stampAmount,
        total,
        notes,
        refInvoiceId: dto.refInvoiceId ?? null,
        internalNotes: dto.internalNotes ?? null,
      },
      lines,
      payment: dto.payment,
    };
  }

  async create(tenantId: string, dto: CreateInvoiceDto) {
    const p = await this.prepare(tenantId, dto);
    return this.prisma.invoice.create({
      data: { tenantId, ...p.data, sequence: 0, number: '', status: 'DRAFT', lines: { create: p.lines } },
      include: { lines: true, customer: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const existing = await this.get(tenantId, id);
    if (existing.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be edited');
    const p = await this.prepare(tenantId, dto);
    return this.prisma.invoice.update({
      where: { id },
      data: { ...p.data, lines: { deleteMany: {}, create: p.lines } },
      include: { lines: true, customer: true },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.get(tenantId, id);
    if (existing.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be deleted');
    await this.prisma.invoice.delete({ where: { id } });
  }

  /**
   * Issue a draft: assign the next progressive number for year/type, build the FatturaPA
   * XML, store it and mark the invoice ISSUED. Numbering and file writing happen in one
   * transaction so that a failed XML never consumes a number.
   */
  async issue(tenantId: string, id: string, dto?: { payment?: CreateInvoiceDto['payment'] }) {
    const existing = await this.get(tenantId, id);
    if (existing.status !== 'DRAFT') throw new BadRequestException('Invoice already issued');
    const rules = await this.rules.getActive(existing.year);
    const { profile } = await this.tenants.getWithProfile(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const last = await tx.invoice.aggregate({ where: { tenantId, year: existing.year, type: existing.type, status: { not: 'DRAFT' } }, _max: { sequence: true } });
      const sequence = (last._max.sequence ?? 0) + 1;
      // Separate series per document type; TD04/TD05 get an explicit prefix (Numero: Basic Latin, max 20 chars).
      const prefix = existing.type === 'TD04' ? 'NC-' : existing.type === 'TD05' ? 'ND-' : '';
      const number = `${prefix}${sequence}/${existing.year}`;
      const transmissions = await tx.invoice.count({ where: { tenantId, xmlFileName: { not: null } } });
      const transmissionSeq = transmissions + 1;

      const refInvoice = existing.refInvoiceId ? await tx.invoice.findUnique({ where: { id: existing.refInvoiceId } }) : null;
      const model = this.toFatturaPa({ ...existing, number }, profile, rules, transmissionSeq, refInvoice, dto?.payment);
      const xml = buildInvoiceXml(model);
      const xmlFileName = invoiceFileName(profile.country, profile.fiscalCode, transmissionSeq);
      const xmlPath = await this.storage.write(`${tenantId}/invoices/${existing.year}/${xmlFileName}`, xml);

      return tx.invoice.update({
        where: { id },
        data: { sequence, number, status: 'ISSUED', xmlFileName, xmlPath },
        include: { lines: true, customer: true },
      });
    });
  }

  async xml(tenantId: string, id: string): Promise<{ fileName: string; content: string }> {
    const inv = await this.get(tenantId, id);
    if (!inv.xmlPath || !inv.xmlFileName) throw new NotFoundException('Invoice has no XML yet (not issued)');
    return { fileName: inv.xmlFileName, content: (await this.storage.read(inv.xmlPath)).toString('utf8') };
  }

  private toFatturaPa(
    inv: InvoiceWithRelations,
    profile: TenantProfile,
    rules: FiscalRuleSet,
    transmissionSeq: number,
    refInvoice: Invoice | null,
    payment?: CreateInvoiceDto['payment'],
  ): FlatRateInvoice {
    const c = inv.customer;
    const foreign = c.kind === 'EU' || c.kind === 'NON_EU';
    const vatNature = inv.vatNature === 'N2_1' ? 'N2.1' : 'N2.2';
    const isPa = c.kind === 'IT_PA';
    const total = Number(inv.total);
    const taxableAmount = Number(inv.taxableAmount);
    const inpsSurcharge = Number(inv.inpsSurcharge);

    return {
      format: isPa ? 'FPA12' : 'FPR12',
      transmissionId: String(transmissionSeq).padStart(5, '0'),
      recipientCode: c.recipientCode,
      recipientPec: c.recipientCode === '0000000' ? (c.recipientPec ?? undefined) : undefined,
      supplier: {
        countryCode: profile.country,
        vatNumber: profile.vatNumber,
        fiscalCode: profile.fiscalCode,
        businessName: profile.businessName ?? undefined,
        firstName: profile.businessName ? undefined : profile.firstName,
        lastName: profile.businessName ? undefined : profile.lastName,
        taxRegime: rules.eInvoice.taxRegime as 'RF19',
        address: { street: profile.address, postalCode: profile.postalCode, city: profile.city, province: profile.province, country: profile.country },
      },
      customer: {
        countryCode: c.countryCode,
        vatNumber: c.vatNumber ?? undefined,
        fiscalCode: c.fiscalCode ?? undefined,
        businessName: c.businessName ?? undefined,
        firstName: c.businessName ? undefined : (c.firstName ?? undefined),
        lastName: c.businessName ? undefined : (c.lastName ?? undefined),
        address: {
          street: c.address,
          postalCode: c.postalCode ?? (foreign ? '00000' : ''),
          city: c.city,
          province: foreign ? undefined : (c.province ?? undefined),
          country: c.country,
        },
      },
      documentType: inv.type,
      number: inv.number,
      date: inv.date.toISOString().slice(0, 10),
      currency: inv.currency,
      vatNature,
      legalReference: foreign ? 'Art. 7-ter DPR 633/72' : 'Art. 1, commi 54-89, L. 190/2014',
      notes: inv.notes,
      lines: inv.lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unit: l.unit ?? undefined,
        unitPrice: Number(l.unitPrice),
        totalPrice: Number(l.totalPrice),
      })),
      socialSecurityFund: inpsSurcharge > 0
        ? { type: rules.eInvoice.inpsFundType, ratePct: rules.inps.surchargePct, taxable: taxableAmount, amount: inpsSurcharge }
        : undefined,
      stampDuty: inv.virtualStamp ? { amount: Number(inv.stampAmount) } : undefined,
      payment: payment
        ? { terms: 'TP02', method: payment.method ?? 'MP05', dueDate: payment.dueDate, amount: total, iban: payment.iban }
        : undefined,
      relatedDocuments: refInvoice ? [{ number: refInvoice.number, date: refInvoice.date.toISOString().slice(0, 10) }] : undefined,
    };
  }
}
