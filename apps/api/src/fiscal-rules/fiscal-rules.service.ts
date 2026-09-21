import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class FiscalRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Insert bundled rule sets that are not in the database yet (as DRAFT). Idempotent. */
  async seedBundled(): Promise<number> {
    let inserted = 0;
    for (const rules of BUNDLED_RULE_SETS) {
      const exists = await this.prisma.fiscalRuleSet.findFirst({ where: { year: rules.year } });
      if (exists) continue;
      const { sourceRefs, ...data } = rules;
      await this.prisma.fiscalRuleSet.create({
        data: { year: rules.year, version: 1, status: 'DRAFT', data, sourceRefs, notes: 'Bundled with the application' },
      });
      inserted += 1;
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

  /** The ACTIVE rule set for a year, parsed against the schema. Throws if none is active. */
  async getActive(year: number): Promise<FiscalRuleSet> {
    const row = await this.prisma.fiscalRuleSet.findFirst({ where: { year, status: 'ACTIVE' }, orderBy: { version: 'desc' } });
    if (!row) throw new NotFoundException(`No active fiscal rule set for ${year}`);
    return parseFiscalRuleSet({ ...(row.data as object), sourceRefs: row.sourceRefs });
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

  async deadlines(year: number, opts: DeadlineOptions): Promise<Deadline[]> {
    const rules = await this.getActive(year);
    return buildDeadlines(rules, opts);
  }
}
