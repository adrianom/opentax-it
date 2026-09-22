import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  buildPaymentSchedule,
  findInpsOfficeById,
  i24CancelBy,
  maxInstallmentDates,
  nextBusinessDay,
  parseIsoDate,
  toIsoDate,
  type F24Draft,
  type FiscalRuleSet,
  type PaymentScheduleAmounts,
} from '@opentax-it/fiscal-rules';
import type { F24Kind, F24Status } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaxesService } from '../taxes/taxes.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { F24PdfService } from './f24-pdf.service.js';
import { type PlanOptionsDto, type PlanStart, type UpdateF24StatusDto } from './f24.dto.js';

/**
 * Installment plans and F24 forms for the balance/advances of a tax year. The forms are
 * computed by packages/fiscal-rules (f24-schedule.ts, with sources) from the tax summary
 * of the year and the tenant profile (INPS office code); this service persists them and
 * tracks their status (planned → I24 scheduled → paid).
 *
 * Deadlines that fall on a Saturday or holiday are paid on the next business day
 * (DL 70/2011 art. 7); the installment interest is computed on the nominal dates
 * (Redditi PF 2026 instructions, "Rateazione").
 */

export interface PlanStartOption {
  start: PlanStart;
  date: string;
  surchargePct: number;
  maxInstallments: number;
  source?: string;
}

@Injectable()
export class F24Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxes: TaxesService,
    private readonly tenants: TenantsService,
    private readonly pdf24: F24PdfService,
  ) {}

  /** The four possible first due dates (ordinary, yearly extension, 30-day deferrals) offered by the payment year's rule set. */
  startOptions(rules: FiscalRuleSet): PlanStartOption[] {
    const d = rules.deadlines;
    const opt = (start: PlanStart, date: string | undefined, surchargePct: number | undefined, refKey: string): PlanStartOption | null =>
      date
        ? { start, date, surchargePct: surchargePct ?? 0, maxInstallments: maxInstallmentDates(parseIsoDate(date), d.installmentDay, d.installmentsEnd).length, source: rules.sourceRefs[refKey]?.title }
        : null;
    return [
      opt('ORDINARY', d.balanceAndFirstAdvance, 0, 'deadlines.balanceAndFirstAdvance'),
      opt('EXTENDED', d.balanceAndFirstAdvanceExtended, 0, 'deadlines.balanceAndFirstAdvanceExtended'),
      opt('DEFERRED', d.deferred, d.deferralSurchargePct, 'deadlines.deferred'),
      opt('DEFERRED_EXTENDED', d.deferredExtended, d.deferralSurchargeExtendedPct, 'deadlines.balanceAndFirstAdvanceExtended'),
    ].filter((o): o is PlanStartOption => o !== null);
  }

  async planOptions(tenantId: string, taxYear: number) {
    const { paymentRules, paymentRulesYear, warnings } = await this.taxes.rulesForTaxYear(taxYear);
    await this.tenants.getWithProfile(tenantId);
    return { taxYear, paymentYear: taxYear + 1, rulesYear: paymentRulesYear, warnings, starts: this.startOptions(paymentRules), secondAdvanceDate: paymentRules.deadlines.secondAdvance };
  }

  private async compute(tenantId: string, taxYear: number, dto: PlanOptionsDto) {
    const { profile } = await this.tenants.getWithProfile(tenantId);
    const office = profile.inpsOfficeId ? findInpsOfficeById(profile.inpsOfficeId) : undefined;
    if (!office) throw new BadRequestException('Set the INPS office (codice sede) in the profile before generating F24 forms');
    const [summary, { paymentRules, paymentRulesYear, warnings }] = await Promise.all([this.taxes.summary(tenantId, taxYear), this.taxes.rulesForTaxYear(taxYear)]);
    const start = this.startOptions(paymentRules).find((o) => o.start === dto.start);
    if (!start) throw new BadRequestException(`Start "${dto.start}" is not available for ${paymentRulesYear}`);
    if (dto.installments > start.maxInstallments) throw new BadRequestException(`At most ${start.maxInstallments} installments from ${start.date} (plan must end by 16 December)`);

    const amounts: PaymentScheduleAmounts = {
      taxBalance: Math.max(0, summary.taxBalance),
      taxFirstAdvance: summary.nextYearAdvances.tax.first,
      taxSecondAdvance: summary.nextYearAdvances.tax.second,
      inpsBalance: Math.max(0, summary.inpsBalance),
      inpsFirstAdvance: summary.nextYearAdvances.inps.first,
      inpsSecondAdvance: summary.nextYearAdvances.inps.second,
    };
    const schedule = buildPaymentSchedule(paymentRules, {
      taxYear,
      amounts,
      inpsOfficeCode: office.code,
      inpsReducedRate: summary.input.inpsRatePct === paymentRules.inps.reducedRatePct,
      firstDueDate: parseIsoDate(start.date),
      surchargePct: start.surchargePct,
      installments: dto.installments,
      secondAdvanceDate: parseIsoDate(paymentRules.deadlines.secondAdvance),
    });
    return {
      taxYear,
      paymentYear: taxYear + 1,
      rulesYear: paymentRulesYear,
      ruleSetVersion: await this.activeVersion(paymentRulesYear),
      start: start.start,
      firstDueDate: start.date,
      surchargePct: start.surchargePct,
      installments: dto.installments,
      maxInstallments: start.maxInstallments,
      amounts,
      credits: { tax: Math.max(0, -summary.taxBalance), inps: Math.max(0, -summary.inpsBalance) },
      inpsOfficeCode: office.code,
      forms: schedule.forms.map(serializeForm),
      warnings: [...warnings, ...schedule.warnings],
    };
  }

  private async activeVersion(year: number) {
    const rs = await this.prisma.fiscalRuleSet.findFirst({ where: { year, status: 'ACTIVE' }, select: { version: true } });
    return rs?.version ?? null;
  }

  async preview(tenantId: string, taxYear: number, dto: PlanOptionsDto) {
    return this.compute(tenantId, taxYear, dto);
  }

  async createPlan(tenantId: string, taxYear: number, dto: PlanOptionsDto) {
    const existing = await this.prisma.installmentPlan.findUnique({ where: { tenantId_taxYear: { tenantId, taxYear } } });
    if (existing) throw new ConflictException(`A plan for ${taxYear} already exists: delete it to generate a new one`);
    const p = await this.compute(tenantId, taxYear, dto);
    if (p.rulesYear !== taxYear + 1) throw new ConflictException(`The rule set for ${taxYear + 1} is not active: the plan cannot be saved with the dates of ${p.rulesYear}`);
    if (p.forms.length === 0) throw new BadRequestException('Nothing to pay: no balance or advance due');
    await this.prisma.installmentPlan.create({
      data: {
        tenantId,
        taxYear,
        paymentYear: p.paymentYear,
        firstDueDate: parseIsoDate(p.firstDueDate),
        installments: p.installments,
        surchargePct: p.surchargePct,
        taxBalance: p.amounts.taxBalance,
        taxFirstAdvance: p.amounts.taxFirstAdvance,
        taxSecondAdvance: p.amounts.taxSecondAdvance,
        inpsBalance: p.amounts.inpsBalance,
        inpsFirstAdvance: p.amounts.inpsFirstAdvance,
        inpsSecondAdvance: p.amounts.inpsSecondAdvance,
        ruleSetVersion: p.ruleSetVersion,
        f24s: {
          create: p.forms.map((f) => ({
            tenantId,
            kind: f.kind as F24Kind,
            paymentDate: parseIsoDate(f.paymentDate),
            installmentNumber: f.installmentNumber ?? null,
            installmentsTotal: f.installmentsTotal ?? null,
            totalDebit: f.totalDebit,
            balance: f.totalDebit,
            i24CancelBy: parseIsoDate(f.i24CancelBy),
            lines: {
              create: f.lines.map((l) => ({
                section: l.section,
                role: l.role,
                code: l.code,
                officeCode: l.officeCode ?? null,
                installmentCode: l.installmentCode ?? null,
                periodFrom: l.periodFrom ?? null,
                periodTo: l.periodTo ?? null,
                referenceYear: l.referenceYear,
                debitAmount: l.debitAmount,
                description: l.description,
              })),
            },
          })),
        },
      },
    });
    return this.getPlan(tenantId, taxYear);
  }

  async getPlan(tenantId: string, taxYear: number) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { tenantId_taxYear: { tenantId, taxYear } },
      include: { f24s: { include: { lines: true }, orderBy: { paymentDate: 'asc' } } },
    });
    if (!plan) throw new NotFoundException(`No plan for ${taxYear}`);
    return plan;
  }

  async listByPaymentYear(tenantId: string, year: number) {
    return this.prisma.f24.findMany({
      where: { tenantId, paymentDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
      include: { lines: true, plan: { select: { taxYear: true, installments: true } } },
      orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async deletePlan(tenantId: string, taxYear: number) {
    const plan = await this.getPlan(tenantId, taxYear);
    const locked = plan.f24s.filter((f) => f.status === 'PAID' || f.status === 'SCHEDULED_I24');
    if (locked.length > 0) throw new ConflictException(`${locked.length} form(s) are paid or scheduled: set them back to planned before deleting the plan`);
    await this.prisma.installmentPlan.delete({ where: { id: plan.id } });
  }

  async get(tenantId: string, id: string) {
    const f24 = await this.prisma.f24.findFirst({ where: { id, tenantId }, include: { lines: true, plan: { select: { taxYear: true, installments: true } } } });
    if (!f24) throw new NotFoundException('F24 not found');
    return f24;
  }

  async pdf(tenantId: string, id: string) {
    const [f24, { profile }] = await Promise.all([this.get(tenantId, id), this.tenants.getWithProfile(tenantId)]);
    const content = await this.pdf24.render({
      paymentDate: toIsoDate(f24.paymentDate),
      fiscalCode: profile.fiscalCode,
      name: profile.businessName ?? profile.lastName,
      firstName: profile.businessName ? null : profile.firstName,
      birthDate: profile.birthDate ? toIsoDate(profile.birthDate) : null,
      sex: profile.sex,
      birthPlace: profile.birthPlace,
      birthProvince: profile.birthProvince,
      city: profile.city,
      province: profile.province,
      address: profile.address,
      lines: f24.lines.map((l) => ({
        section: l.section,
        code: l.code,
        officeCode: l.officeCode,
        installmentCode: l.installmentCode,
        localCode: l.localCode,
        periodFrom: l.periodFrom,
        periodTo: l.periodTo,
        referenceYear: l.referenceYear,
        debitAmount: Number(l.debitAmount),
        creditAmount: Number(l.creditAmount),
      })),
    });
    const date = toIsoDate(f24.paymentDate);
    const label = f24.installmentNumber ? `rata-${f24.installmentNumber}-di-${f24.installmentsTotal}` : f24.kind.toLowerCase().replace(/_/g, '-');
    return { fileName: `F24_${date}_${label}.pdf`, content };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateF24StatusDto) {
    const f24 = await this.prisma.f24.findFirst({ where: { id, tenantId } });
    if (!f24) throw new NotFoundException('F24 not found');
    const status = dto.status as F24Status;
    const data =
      status === 'PAID'
        ? { status, paidOn: dto.paidOn ? parseIsoDate(dto.paidOn) : new Date(), i24ScheduledAt: f24.i24ScheduledAt }
        : status === 'SCHEDULED_I24'
          ? { status, paidOn: null, i24ScheduledAt: new Date() }
          : { status, paidOn: null, i24ScheduledAt: null };
    return this.prisma.f24.update({ where: { id }, data, include: { lines: true } });
  }
}

/** Payment date moved to the next business day; the I24 cancellation limit follows the actual debit date. */
function serializeForm(f: F24Draft) {
  const paymentDate = nextBusinessDay(f.paymentDate);
  return {
    ...f,
    nominalPaymentDate: toIsoDate(f.paymentDate),
    paymentDate: toIsoDate(paymentDate),
    i24CancelBy: toIsoDate(i24CancelBy(paymentDate)),
  };
}
