import type { FiscalRuleSet } from './rule-set.js';
import { profitabilityCoefficient } from './rule-set.js';

/**
 * Income, substitute tax and INPS computation for a flat-rate professional
 * (Gestione Separata). Pure functions; every step maps to a row of the official
 * Redditi PF return.
 *
 * Sources:
 * - L. 190/2014 art. 1 par. 64: taxable income = collected revenue × profitability
 *   coefficient; social security contributions paid are deducted in full; the tax is
 *   15% (5% under par. 65 for the start year and the four following ones).
 * - Redditi PF 2026 instructions, booklet 3, LM section III: LM22 col. 3 collected
 *   revenue, col. 5 = col. 3 × coefficient; LM34 gross income; LM35 contributions paid
 *   (col. 2: the part that fits within LM34); LM36 = LM34 − LM35 col. 2; LM39 tax.
 * - Redditi PF 2026 instructions, booklet 2, RR section II: INPS base = flat-rate income
 *   (gross, before the contribution deduction) up to the yearly ceiling; contribution =
 *   base × rate (RR5 col. 15).
 * - Advance payments: Circ. AdE 10/E/2016 §4 ("si applicano tutte le disposizioni
 *   vigenti in materia di versamenti a saldo ed in acconto ... dell'IRPEF"); art. 72
 *   D.Lgs. 33/2025 (100% of the previous period's tax net of credits and withholdings);
 *   Redditi PF 2026 instructions, booklet 1, RN62 (not due below EUR 51.65; single
 *   instalment by 30 November below EUR 257.52; otherwise 40% + 60%).
 * - INPS advances: L. 662/1996 art. 1 par. 212 (40% + 40% of the contribution due on the
 *   previous year's income); INPS circular no. 8/2026 §4.2 (computed with the current
 *   year's rate).
 * - Rounding: Redditi PF 2026 instructions, booklet 1, "Modalità di arrotondamento":
 *   "Tutti gli importi indicati nella dichiarazione devono essere arrotondati all'unità di
 *   euro, per eccesso se la frazione decimale è uguale o superiore a cinquanta centesimi";
 *   §7 "Gli importi delle imposte che scaturiscono dalla dichiarazione devono essere versati
 *   arrotondati all'unità di euro, così come determinati nella dichiarazione stessa. Se,
 *   invece, l'ammontare indicato in dichiarazione deve essere successivamente elaborato
 *   (rateazioni) ... arrotondamento al centesimo". Every value below is a return row and
 *   is therefore a whole number of euro; installments are split in cents (installment-plan.ts).
 */

/** Rounds to the euro unit as in the tax return (≥ 50 cents up). */
export const roundEuro = (n: number) => Math.round(n + Number.EPSILON);

export interface TaxInput {
  /** Tax year. */
  year: number;
  /** Revenue collected in the year (cash basis), EUR — LM22 col. 3. */
  collectedRevenue: number;
  /** ATECO 2007 code of the activity. */
  atecoCode: string;
  /** Year the activity started (par. 65: reduced rate for that year and the four following). */
  activityStartYear: number;
  /** The taxpayer meets the par. 65 conditions for the reduced rate. */
  reducedRateEligible: boolean;
  /** Social security contributions actually paid in the year, EUR — LM35 col. 1. */
  contributionsPaid: number;
  /** INPS rate to apply (full or reduced), percentage — RR5 col. 14. */
  inpsRatePct: number;
  /** Tax credits and withholdings to subtract from the tax (LM40 + LM41), EUR. */
  taxCredits?: number;
}

export interface TaxResult {
  coefficientPct: number; // LM22 col. 2
  grossIncome: number; // LM34
  contributionsDeducted: number; // LM35 col. 2
  netIncome: number; // LM36 / LM38
  taxRatePct: number;
  substituteTax: number; // LM39
  taxNetOfCredits: number; // LM42 (base for advances)
  inpsTaxableIncome: number; // RR5 col. 11
  inpsContribution: number; // RR5 col. 15
}

/** Whether the reduced rate applies in `year` (par. 65: start year + 4 following years). */
export function reducedRateApplies(rules: FiscalRuleSet, year: number, activityStartYear: number, eligible: boolean): boolean {
  return eligible && year >= activityStartYear && year < activityStartYear + rules.flatRate.reducedRateYears;
}

export function computeTaxes(rules: FiscalRuleSet, input: TaxInput): TaxResult {
  const coefficientPct = profitabilityCoefficient(rules, input.atecoCode);
  const collectedRevenue = roundEuro(input.collectedRevenue); // LM22 col. 3
  const grossIncome = roundEuro((collectedRevenue * coefficientPct) / 100);
  const contributionsDeducted = Math.min(roundEuro(input.contributionsPaid), grossIncome);
  const netIncome = roundEuro(grossIncome - contributionsDeducted);
  const taxRatePct = reducedRateApplies(rules, input.year, input.activityStartYear, input.reducedRateEligible)
    ? rules.flatRate.reducedRatePct
    : rules.flatRate.standardRatePct;
  const substituteTax = roundEuro((netIncome * taxRatePct) / 100);
  const taxNetOfCredits = Math.max(0, roundEuro(substituteTax - roundEuro(input.taxCredits ?? 0)));
  const inpsTaxableIncome = Math.min(grossIncome, rules.inps.incomeCeiling);
  const inpsContribution = roundEuro((inpsTaxableIncome * input.inpsRatePct) / 100);
  return { coefficientPct, grossIncome, contributionsDeducted, netIncome, taxRatePct, substituteTax, taxNetOfCredits, inpsTaxableIncome, inpsContribution };
}

export interface AdvanceSchedule {
  /** Total advance due for the following year. */
  total: number;
  /** First instalment (June/July), 0 when paid in a single instalment or not due. */
  first: number;
  /** Second or single instalment (30 November). */
  second: number;
  mode: 'NOT_DUE' | 'SINGLE' | 'TWO_INSTALMENTS';
}

/** Substitute tax advance for the following year (IRPEF rules per Circ. 10/E/2016 §4; Istr. RN62). */
export function substituteTaxAdvance(rules: FiscalRuleSet, taxNetOfCredits: number): AdvanceSchedule {
  const a = rules.advancePayment;
  const total = roundEuro((taxNetOfCredits * a.percentage) / 100);
  if (taxNetOfCredits < a.notDueBelow) return { total: 0, first: 0, second: 0, mode: 'NOT_DUE' };
  if (total < a.singleInstallmentBelow) return { total, first: 0, second: total, mode: 'SINGLE' };
  const first = roundEuro((total * a.firstInstallmentPct) / 100);
  return { total, first, second: roundEuro(total - first), mode: 'TWO_INSTALMENTS' };
}

/**
 * INPS advance for the following year: 40% + 40% of the contribution due on this year's
 * income (L. 662/96 par. 212), using the given rate (the following year's rate per INPS circular).
 */
export function inpsAdvance(rules: FiscalRuleSet, inpsTaxableIncome: number, nextYearRatePct: number): AdvanceSchedule {
  const contribution = roundEuro((inpsTaxableIncome * nextYearRatePct) / 100);
  const total = roundEuro((contribution * rules.inps.advancePct) / 100);
  const each = roundEuro(total / rules.inps.advanceInstallments);
  return { total, first: each, second: roundEuro(total - each), mode: 'TWO_INSTALMENTS' };
}

export interface ThresholdStatus {
  collectedRevenue: number;
  accessThreshold: number; // par. 54: stay in the regime next year
  exitThreshold: number; // par. 71: immediate exit
  exceedsAccessThreshold: boolean;
  exceedsExitThreshold: boolean;
}

/** Position against the EUR 85,000 / 100,000 thresholds (L. 190/2014 art. 1 par. 54 and 71). */
export function thresholdStatus(rules: FiscalRuleSet, collectedRevenue: number): ThresholdStatus {
  const accessThreshold = rules.flatRate.revenueThreshold;
  const exitThreshold = rules.flatRate.immediateExitThreshold;
  return {
    collectedRevenue,
    accessThreshold,
    exitThreshold,
    exceedsAccessThreshold: collectedRevenue > accessThreshold,
    exceedsExitThreshold: collectedRevenue > exitThreshold,
  };
}
