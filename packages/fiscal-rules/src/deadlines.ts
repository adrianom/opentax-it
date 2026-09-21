import { nextBusinessDay, parseIsoDate, toIsoDate, utcDate } from './calendar.js';
import type { FiscalRuleSet } from './rule-set.js';

/**
 * Yearly deadline calendar for a flat-rate professional (INPS Gestione Separata),
 * generated from the year's FiscalRuleSet. Nominal dates are moved to the next
 * business day when they fall on a Saturday/holiday (DL 70/2011 art. 7).
 */

export type DeadlineKind =
  | 'TAX_BALANCE'
  | 'TAX_FIRST_ADVANCE'
  | 'TAX_SECOND_ADVANCE'
  | 'INPS_BALANCE'
  | 'INPS_FIRST_ADVANCE'
  | 'INPS_SECOND_ADVANCE'
  | 'STAMP_DUTY'
  | 'TAX_RETURN'
  | 'INTRASTAT';

export interface Deadline {
  kind: DeadlineKind;
  /** Nominal date from the law/instructions. */
  nominalDate: string;
  /** Effective date after moving to the next business day. */
  date: string;
  description: string;
  /** Structured details so that user interfaces can localize the description. */
  details: {
    taxYear: number;
    percentage?: number;
    quarter?: number;
    splittable?: boolean;
    /** Stamp duty: amount due for the quarter, and the ordinary date when the deferral moved the deadline. */
    amount?: number;
    deferredFrom?: string;
  };
  /** F24 tax code / INPS reason to use, when applicable. */
  code?: string;
  source?: string;
}

export interface DeadlineOptions {
  /** The taxpayer is eligible for the yearly extension (flat-rate/ISA), when the rule set provides one. */
  applyExtension?: boolean;
  /** Activity with an approved ISA within its revenue limit: advances 50% + 50% (DL 124/2019 art. 58). */
  isaSubject?: boolean;
  /** Supplies services to EU taxable persons (quarterly Intrastat for services rendered). */
  quarterlyIntrastat?: boolean;
  /**
   * Stamp duty due per quarter (EUR). When provided, the deferrals of the AdE stamp duty guide
   * are applied: Q1 may be paid with Q2 if Q1 ≤ threshold; Q1 and Q2 may be paid with Q3 if
   * Q1 + Q2 ≤ threshold. Quarters not listed count as 0.
   */
  stampDutyByQuarter?: Partial<Record<1 | 2 | 3 | 4, number>>;
}

function deadline(
  kind: DeadlineKind,
  nominal: string,
  description: string,
  details: Deadline['details'],
  code?: string,
  source?: string,
): Deadline {
  return { kind, nominalDate: nominal, date: toIsoDate(nextBusinessDay(parseIsoDate(nominal))), description, details, code, source };
}

export function buildDeadlines(rules: FiscalRuleSet, opts: DeadlineOptions = {}): Deadline[] {
  const d = rules.deadlines;
  const tc = rules.taxCodes;
  const ir = rules.inpsReasons;
  const year = rules.year;

  const useExtension = Boolean(opts.applyExtension && d.balanceAndFirstAdvanceExtended);
  const firstDate = useExtension ? d.balanceAndFirstAdvanceExtended! : d.balanceAndFirstAdvance;
  const extensionSource = useExtension ? rules.sourceRefs['deadlines.balanceAndFirstAdvanceExtended']?.title : undefined;
  const inpsAdvanceEach = rules.inps.advancePct / rules.inps.advanceInstallments;
  const firstAdvancePct = opts.isaSubject ? rules.advancePayment.isaSubjectsFirstInstallmentPct : rules.advancePayment.firstInstallmentPct;

  const out: Deadline[] = [
    deadline('TAX_BALANCE', firstDate, `Substitute tax balance ${year - 1} (or first installment)`, { taxYear: year - 1, splittable: true }, tc.substituteTaxBalance, extensionSource),
    deadline('TAX_FIRST_ADVANCE', firstDate, `Substitute tax first advance ${year} (${firstAdvancePct}%)`, { taxYear: year, percentage: firstAdvancePct, splittable: true }, tc.substituteTaxFirstAdvance, extensionSource),
    deadline('INPS_BALANCE', firstDate, `INPS Gestione Separata balance ${year - 1}`, { taxYear: year - 1, splittable: true }, ir.contribution, extensionSource),
    deadline('INPS_FIRST_ADVANCE', firstDate, `INPS first advance ${year} (${inpsAdvanceEach}%)`, { taxYear: year, percentage: inpsAdvanceEach, splittable: true }, ir.contribution, extensionSource),
    deadline('TAX_SECOND_ADVANCE', d.secondAdvance, `Substitute tax second advance ${year} (${100 - firstAdvancePct}%) — cannot be split`, { taxYear: year, percentage: 100 - firstAdvancePct, splittable: false }, tc.substituteTaxSecondAdvance),
    deadline('INPS_SECOND_ADVANCE', d.secondAdvance, `INPS second advance ${year} (${inpsAdvanceEach}%)`, { taxYear: year, percentage: inpsAdvanceEach, splittable: false }, ir.contribution),
    deadline('TAX_RETURN', d.taxReturnFiling, `Redditi PF ${year} filing (tax year ${year - 1})`, { taxYear: year - 1 }),
  ];

  const stampDeadlines = [...rules.stampDuty.deadlines].sort((a, b) => a.quarter - b.quarter);
  const dateOfQuarter = (q: number) => stampDeadlines.find((s) => s.quarter === q)?.date;
  const amounts = opts.stampDutyByQuarter;
  for (const s of stampDeadlines) {
    let nominal = s.date;
    let deferredFrom: string | undefined;
    if (amounts) {
      // AdE stamp duty guide (June 2026), notes (*) and (**) to the deadline table.
      const q1 = amounts[1] ?? 0;
      const q2 = amounts[2] ?? 0;
      const th = rules.stampDuty.deferralThreshold;
      const q3Date = dateOfQuarter(3);
      const q2Date = dateOfQuarter(2);
      if (s.quarter === 1 && q1 + q2 <= th && q3Date) [nominal, deferredFrom] = [q3Date, s.date];
      else if (s.quarter === 1 && q1 <= th && q2Date) [nominal, deferredFrom] = [q2Date, s.date];
      else if (s.quarter === 2 && q1 + q2 <= th && q3Date) [nominal, deferredFrom] = [q3Date, s.date];
    }
    out.push(
      deadline('STAMP_DUTY', nominal, `E-invoice stamp duty ${year} — Q${s.quarter}`, {
        taxYear: year,
        quarter: s.quarter,
        amount: amounts ? (amounts[s.quarter as 1 | 2 | 3 | 4] ?? 0) : undefined,
        deferredFrom,
      }, s.taxCode),
    );
  }

  if (opts.quarterlyIntrastat) {
    // Quarterly lists by the 25th of the month following the quarter (ADM).
    const quarters: Array<[number, number]> = [[1, 4], [2, 7], [3, 10], [4, 1]];
    for (const [q, month] of quarters) {
      const y = q === 4 ? year + 1 : year;
      out.push(deadline('INTRASTAT', toIsoDate(utcDate(y, month, rules.intrastat.dueDay)), `Intrastat services rendered — Q${q} ${year}`, { taxYear: year, quarter: q }));
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}
