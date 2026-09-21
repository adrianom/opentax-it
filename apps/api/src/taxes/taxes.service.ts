import { Injectable } from '@nestjs/common';
import { computeTaxes, inpsAdvance, substituteTaxAdvance, thresholdStatus } from '@opentax-it/fiscal-rules';
import { FiscalRulesService } from '../fiscal-rules/fiscal-rules.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import type { UpdateTaxYearDataDto } from './taxes.dto.js';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Yearly tax summary for a tenant: collected revenue (cash basis) → income → substitute
 * tax and INPS, balance due and advances for the following year. Rules and sources in
 * packages/fiscal-rules/src/tax-computation.ts.
 *
 * Year N is computed with the rule set of year N+1 (the return filed and paid in N+1),
 * falling back to the rule set of year N when N+1 is not active yet (e.g. the current year).
 */
@Injectable()
export class TaxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: FiscalRulesService,
    private readonly payments: PaymentsService,
    private readonly tenants: TenantsService,
  ) {}

  async yearData(tenantId: string, year: number) {
    return this.prisma.taxYearData.upsert({ where: { tenantId_year: { tenantId, year } }, update: {}, create: { tenantId, year } });
  }

  async updateYearData(tenantId: string, year: number, dto: UpdateTaxYearDataDto) {
    const { contributionsPaid, taxAdvancesPaid, inpsAdvancesPaid, taxCredits, inpsReducedRate } = dto;
    const data = { contributionsPaid, taxAdvancesPaid, inpsAdvancesPaid, taxCredits, inpsReducedRate };
    return this.prisma.taxYearData.upsert({ where: { tenantId_year: { tenantId, year } }, update: data, create: { tenantId, year, ...data } });
  }

  private async rulesForTaxYear(year: number) {
    try {
      return { rules: await this.rules.getActive(year + 1), rulesYear: year + 1 };
    } catch {
      return { rules: await this.rules.getActive(year), rulesYear: year };
    }
  }

  async summary(tenantId: string, year: number) {
    const { profile } = await this.tenants.getWithProfile(tenantId);
    const [data, collectedRevenue, { rules, rulesYear }] = await Promise.all([
      this.yearData(tenantId, year),
      this.payments.collectedRevenue(tenantId, year),
      this.rulesForTaxYear(year),
    ]);
    const inpsRatePct = data.inpsReducedRate ? rules.inps.reducedRatePct : rules.inps.fullRatePct;
    const result = computeTaxes(rules, {
      year,
      collectedRevenue,
      atecoCode: profile.atecoCode,
      activityStartYear: profile.activityStartYear,
      reducedRateEligible: profile.reducedRate,
      contributionsPaid: Number(data.contributionsPaid),
      inpsRatePct,
      taxCredits: Number(data.taxCredits),
    });
    const taxBalance = round2(result.taxNetOfCredits - Number(data.taxAdvancesPaid)); // LM46 (>0) / LM47 (<0)
    const inpsBalance = round2(result.inpsContribution - Number(data.inpsAdvancesPaid)); // RR7 / RR8
    return {
      year,
      rulesYear,
      collectedRevenue,
      thresholds: thresholdStatus(rules, collectedRevenue),
      input: {
        atecoCode: profile.atecoCode,
        activityStartYear: profile.activityStartYear,
        reducedRateEligible: profile.reducedRate,
        contributionsPaid: Number(data.contributionsPaid),
        taxAdvancesPaid: Number(data.taxAdvancesPaid),
        inpsAdvancesPaid: Number(data.inpsAdvancesPaid),
        taxCredits: Number(data.taxCredits),
        inpsRatePct,
      },
      result,
      taxBalance,
      inpsBalance,
      nextYearAdvances: {
        tax: substituteTaxAdvance(rules, result.taxNetOfCredits),
        inps: inpsAdvance(rules, result.inpsTaxableIncome, inpsRatePct),
      },
    };
  }
}
