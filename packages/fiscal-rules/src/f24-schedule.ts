import { businessDaysBefore, toIsoDate } from './calendar.js';
import { buildInstallmentPlan, type Installment } from './installment-plan.js';
import type { FiscalRuleSet } from './rule-set.js';

/**
 * F24 forms for the balance and advances of a tax year: one form per installment
 * (balance + first advance, split with interest) and one for the second advance.
 * Pure function; the caller persists the result and tracks payment status.
 *
 * Sources:
 * - AdE, "Avvertenze per la compilazione del mod. F24": "Se gli importi dovuti a titolo di
 *   saldo o di acconto sono pagati in unica soluzione, nelle colonne 'rateazione/regione/
 *   prov./mese rif.' della sezione 'Erario' ... indicare 0101; in caso di pagamento rateale
 *   ... la rata che sta pagando e il numero di rate prescelto (ad es., se versa la seconda di
 *   sei rate, deve indicare 0206)". The 0.40% surcharge for the 30-day deferral increases
 *   the amounts before splitting ("maggiorare preventivamente le somme da versare",
 *   Redditi PF 2026 instructions, booklet 1, "Rateazione").
 * - AdE, "Tabella codici tributo" (Erario, 04/01/2021): 1790 and 1792 take NNRR in the
 *   installment column; 1791 (second/single advance) and 1668 (installment interest) take
 *   "0000", i.e. the column is left blank; all four require the reference year (AAAA).
 * - Redditi PF 2026 instructions, booklet 1, §7: installment interest "non vanno cumulati
 *   all'imposta, ma versati separatamente mediante l'apposito codice tributo"; amounts
 *   from the return are whole euro, installments are rounded to the cent.
 * - INPS, "F24 per professionisti iscritti alla Gestione Separata": office code of the
 *   residence, reason PXX (single payment) / PXXR (installments), interest with reason
 *   DPPI on a separate row, period "da 01AAAA a 12AAAA" of the reference year (the year
 *   the balance refers to; the following year for advances).
 * - Provv. AdE 26/07/2024 no. 313945 §5.3 (I24, future-dated F24): cancellation "fino al
 *   terzultimo giorno lavorativo antecedente la data di addebito".
 *
 * Design choice (documented in docs/compliance.md): interest rows are grouped per
 * reference year (one 1668 row and one DPPI row per year), matching the forms prepared
 * by an intermediary for the author; the instructions ask for the interest of a section
 * "in un unico rigo", which is not possible when two reference years are involved.
 */

export type F24Section = 'TREASURY' | 'INPS' | 'REGIONAL' | 'LOCAL';
export type F24LineRole = 'BALANCE' | 'FIRST_ADVANCE' | 'SECOND_ADVANCE' | 'INTEREST' | 'CREDIT' | 'OTHER';

export interface F24LineDraft {
  section: F24Section;
  role: F24LineRole;
  /** Treasury tax code or INPS reason. */
  code: string;
  /** INPS office code (Treasury lines: undefined). */
  officeCode?: string;
  /** Treasury "rateazione" column: NNRR or 0101; undefined when the table says 0000. */
  installmentCode?: string;
  /** INPS period MM/YYYY. */
  periodFrom?: string;
  periodTo?: string;
  referenceYear: number;
  debitAmount: number;
  description: string;
}

export type F24DraftKind = 'BALANCE' | 'INSTALLMENT' | 'SECOND_ADVANCE';

export interface F24Draft {
  kind: F24DraftKind;
  paymentDate: Date;
  installmentNumber?: number;
  installmentsTotal?: number;
  lines: F24LineDraft[];
  totalDebit: number;
  /** Last day to cancel a future-dated debit (I24) for this payment date. */
  i24CancelBy: Date;
}

export interface PaymentScheduleAmounts {
  /** LM46: substitute tax balance due (whole euro; ≤ 0 means a credit, no line). */
  taxBalance: number;
  /** First advance for the following year (RN62 col. 1 logic applied to the substitute tax). */
  taxFirstAdvance: number;
  /** Second or single advance for the following year, 30 November. */
  taxSecondAdvance: number;
  /** RR7: INPS contribution balance due. */
  inpsBalance: number;
  inpsFirstAdvance: number;
  inpsSecondAdvance: number;
}

export interface PaymentScheduleInput {
  /** Income year the balance refers to (advances refer to taxYear + 1). */
  taxYear: number;
  amounts: PaymentScheduleAmounts;
  inpsOfficeCode: string;
  /** 24% rate: reasons P10/P10R instead of PXX/PXXR. */
  inpsReducedRate: boolean;
  /** Due date of the balance and first advance (ordinary, extended or deferred). */
  firstDueDate: Date;
  /** Surcharge applied before splitting when the deferred date is used (0.40 / 0.80). */
  surchargePct?: number;
  /** 1 = single payment. */
  installments: number;
  secondAdvanceDate: Date;
}

export interface PaymentSchedule {
  forms: F24Draft[];
  /** Lines below the F24 minimum per code (EUR 1.03, Redditi PF instructions §7) and similar remarks. */
  warnings: string[];
}

/** "Rateazione" column when the balance/advance is paid in a single payment. */
export const SINGLE_PAYMENT_INSTALLMENT_CODE = '0101';
/** Minimum amount per tax code on the F24 (Redditi PF 2026 instructions, booklet 1, §7). */
export const F24_MIN_LINE_AMOUNT = 1.03;
/** I24: business days before the debit date within which the form can be cancelled (Provv. 313945/2024 §5.3). */
export const I24_CANCEL_BUSINESS_DAYS = 3;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const pad2 = (n: number) => String(n).padStart(2, '0');

export function installmentCode(number: number, total: number): string {
  return `${pad2(number)}${pad2(total)}`;
}

export function i24CancelBy(paymentDate: Date): Date {
  return businessDaysBefore(paymentDate, I24_CANCEL_BUSINESS_DAYS);
}

interface Component {
  key: keyof PaymentScheduleAmounts;
  section: F24Section;
  role: F24LineRole;
  code: string;
  referenceYear: number;
  description: string;
  plan: Installment[];
}

export function buildPaymentSchedule(rules: FiscalRuleSet, input: PaymentScheduleInput): PaymentSchedule {
  const { taxYear, amounts, installments } = input;
  const tc = rules.taxCodes;
  const ir = rules.inpsReasons;
  const surcharge = input.surchargePct ?? 0;
  const single = installments === 1;
  const inpsReason = input.inpsReducedRate ? (single ? ir.contributionReducedRate : ir.installmentsReducedRate) : single ? ir.contribution : ir.installments;
  const warnings: string[] = [];

  const planFor = (amount: number): Installment[] =>
    buildInstallmentPlan({
      amount: round2(amount * (1 + surcharge / 100)),
      firstDueDate: input.firstDueDate,
      installments,
      installmentDay: rules.deadlines.installmentDay,
      end: rules.deadlines.installmentsEnd,
      interest: { annualPct: rules.installments.annualInterestPct, incrementPct: rules.installments.incrementPct },
    });

  const candidates: Array<Omit<Component, 'plan'>> = [
    { key: 'taxBalance', section: 'TREASURY', role: 'BALANCE', code: tc.substituteTaxBalance, referenceYear: taxYear, description: `Substitute tax balance ${taxYear}` },
    { key: 'taxFirstAdvance', section: 'TREASURY', role: 'FIRST_ADVANCE', code: tc.substituteTaxFirstAdvance, referenceYear: taxYear + 1, description: `Substitute tax first advance ${taxYear + 1}` },
    { key: 'inpsBalance', section: 'INPS', role: 'BALANCE', code: inpsReason, referenceYear: taxYear, description: `INPS Gestione Separata balance ${taxYear}` },
    { key: 'inpsFirstAdvance', section: 'INPS', role: 'FIRST_ADVANCE', code: inpsReason, referenceYear: taxYear + 1, description: `INPS Gestione Separata first advance ${taxYear + 1}` },
  ];
  const components: Component[] = candidates.filter((c) => amounts[c.key] > 0).map((c) => ({ ...c, plan: planFor(amounts[c.key]) }));

  const forms: F24Draft[] = [];
  if (components.length > 0) {
    const dates = components[0].plan.map((r) => r.dueDate);
    for (let i = 0; i < installments; i++) {
      const lines: F24LineDraft[] = [];
      const interestByYear = new Map<string, { section: F24Section; referenceYear: number; amount: number }>();
      for (const c of components) {
        const r = c.plan[i];
        lines.push(line(c.section, c.role, c.code, c.referenceYear, r.principal, c.description, {
          installmentCode: c.section === 'TREASURY' ? (single ? SINGLE_PAYMENT_INSTALLMENT_CODE : installmentCode(i + 1, installments)) : undefined,
          officeCode: c.section === 'INPS' ? input.inpsOfficeCode : undefined,
        }));
        if (r.interest > 0) {
          const k = `${c.section}-${c.referenceYear}`;
          const cur = interestByYear.get(k) ?? { section: c.section, referenceYear: c.referenceYear, amount: 0 };
          cur.amount = round2(cur.amount + r.interest);
          interestByYear.set(k, cur);
        }
      }
      for (const it of interestByYear.values()) {
        const treasury = it.section === 'TREASURY';
        lines.push(line(it.section, 'INTEREST', treasury ? tc.installmentInterest : ir.interest, it.referenceYear, it.amount, `Installment interest ${it.referenceYear} (${rules.installments.annualInterestPct}% per year)`, {
          officeCode: treasury ? undefined : input.inpsOfficeCode,
        }));
      }
      forms.push(form(single ? 'BALANCE' : 'INSTALLMENT', dates[i], lines, single ? undefined : { number: i + 1, total: installments }));
    }
  }

  const second: F24LineDraft[] = [];
  if (amounts.taxSecondAdvance > 0) second.push(line('TREASURY', 'SECOND_ADVANCE', tc.substituteTaxSecondAdvance, taxYear + 1, amounts.taxSecondAdvance, `Substitute tax second/single advance ${taxYear + 1}`, {}));
  if (amounts.inpsSecondAdvance > 0) {
    second.push(line('INPS', 'SECOND_ADVANCE', input.inpsReducedRate ? ir.contributionReducedRate : ir.contribution, taxYear + 1, amounts.inpsSecondAdvance, `INPS Gestione Separata second advance ${taxYear + 1}`, { officeCode: input.inpsOfficeCode }));
  }
  if (second.length > 0) forms.push(form('SECOND_ADVANCE', input.secondAdvanceDate, second));

  for (const f of forms) {
    for (const l of f.lines) {
      if (l.debitAmount < F24_MIN_LINE_AMOUNT) warnings.push(`${toIsoDate(f.paymentDate)} ${l.code} ${l.referenceYear}: amount ${l.debitAmount.toFixed(2)} is below the F24 minimum of ${F24_MIN_LINE_AMOUNT}`);
    }
  }
  return { forms, warnings };
}

function line(section: F24Section, role: F24LineRole, code: string, referenceYear: number, amount: number, description: string, extra: { installmentCode?: string; officeCode?: string }): F24LineDraft {
  return {
    section,
    role,
    code,
    officeCode: extra.officeCode,
    installmentCode: extra.installmentCode,
    periodFrom: section === 'INPS' ? `01/${referenceYear}` : undefined,
    periodTo: section === 'INPS' ? `12/${referenceYear}` : undefined,
    referenceYear,
    debitAmount: round2(amount),
    description,
  };
}

function form(kind: F24DraftKind, paymentDate: Date, lines: F24LineDraft[], installment?: { number: number; total: number }): F24Draft {
  return {
    kind,
    paymentDate,
    installmentNumber: installment?.number,
    installmentsTotal: installment?.total,
    lines,
    totalDebit: round2(lines.reduce((s, l) => s + l.debitAmount, 0)),
    i24CancelBy: i24CancelBy(paymentDate),
  };
}
