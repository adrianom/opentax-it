import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ZodError } from 'zod';
import {
  buildDeadlines,
  parseFiscalRuleSet,
  ruleSet2026,
  type Deadline,
  type DeadlineOptions,
  type FiscalRuleSet,
} from '@opentax-it/fiscal-rules';
import { PrismaService } from '../prisma/prisma.service.js';

/** Rule sets shipped with the code; they are seeded as DRAFT and must be activated by an admin. */
const BUNDLED_RULE_SETS: FiscalRuleSet[] = [ruleSet2026];

function contentHash(...parts: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

@Injectable()
export class FiscalRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Insert bundled rule sets as DRAFT. For each year: nothing if the latest stored
   * version has the same content; otherwise a new version (never overwrites a stored
   * set, never activates). Idempotent.
   */
  async seedBundled(): Promise<Array<{ year: number; version: number }>> {
    const inserted: Array<{ year: number; version: number }> = [];
    for (const rules of BUNDLED_RULE_SETS) {
      const { sourceRefs, ...data } = rules;
      const latest = await this.prisma.fiscalRuleSet.findFirst({ where: { year: rules.year }, orderBy: { version: 'desc' } });
      if (latest && contentHash(latest.data, latest.sourceRefs) === contentHash(data, sourceRefs)) continue;
      const version = (latest?.version ?? 0) + 1;
      await this.prisma.fiscalRuleSet.create({
        data: { year: rules.year, version, status: 'DRAFT', data, sourceRefs, notes: 'Bundled with the application' },
      });
      inserted.push({ year: rules.year, version });
    }
    return inserted;
  }

  async listByYear(year: number) {
    return this.prisma.fiscalRuleSet.findMany({
      where: { year },
      orderBy: { version: 'desc' },
      select: { id: true, year: true, version: true, status: true, activatedAt: true, notes: true, createdAt: true },
    });
  }

  /**
   * The ACTIVE rule set for a year, parsed against the current schema. Throws 404 if none
   * is active and 422 if the stored set no longer matches the schema (a newer bundled
   * version must be seeded and activated by an admin).
   */
  async getActive(year: number): Promise<FiscalRuleSet> {
    const row = await this.prisma.fiscalRuleSet.findFirst({ where: { year, status: 'ACTIVE' }, orderBy: { version: 'desc' } });
    if (!row) throw new NotFoundException(`No active fiscal rule set for ${year}`);
    try {
      return parseFiscalRuleSet({ ...(row.data as object), sourceRefs: row.sourceRefs });
    } catch (e) {
      if (e instanceof ZodError) {
        const fields = e.issues.map((i) => i.path.join('.')).join(', ');
        throw new UnprocessableEntityException(
          `Active fiscal rule set ${year} v${row.version} does not match the current schema (${fields}). Seed and activate a newer version.`,
        );
      }
      throw e;
    }
  }

  async activate(id: string, userId?: string) {
    const target = await this.prisma.fiscalRuleSet.findUnique({ where: { id } });
    if (!target) throw new NotFoundException(`Rule set ${id} not found`);
    return this.prisma.$transaction(async (tx) => {
      await tx.fiscalRuleSet.updateMany({ where: { year: target.year, status: 'ACTIVE' }, data: { status: 'SUPERSEDED' } });
      return tx.fiscalRuleSet.update({
        where: { id },
        data: { status: 'ACTIVE', activatedAt: new Date(), activatedById: userId ?? null },
      });
    });
  }

  async deadlines(year: number, opts: DeadlineOptions, tenantId?: string): Promise<Deadline[]> {
    const rules = await this.getActive(year);
    const stampDutyByQuarter = tenantId ? await this.stampDutyByQuarter(tenantId, year) : undefined;
    return buildDeadlines(rules, { ...opts, stampDutyByQuarter });
  }

  /**
   * Stamp duty due per quarter from the tenant's issued e-invoices (virtual stamp flagged),
   * by document date — the basis of the AdE lists A/B (stamp duty guide, June 2026).
   */
  async stampDutyByQuarter(tenantId: string, year: number): Promise<Record<1 | 2 | 3 | 4, number>> {
    const rows = await this.prisma.invoice.findMany({
      where: { tenantId, year, virtualStamp: true, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      select: { date: true, stampAmount: true },
    });
    const totals: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const r of rows) {
      const q = (Math.floor(r.date.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
      totals[q] = Math.round((totals[q] + Number(r.stampAmount)) * 100) / 100;
    }
    return totals;
  }
}
