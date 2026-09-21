/**
 * Installment plan ("rateazione") for the balance and first advance payment of taxes
 * and INPS contributions.
 *
 * Sources:
 * - D.Lgs. 24 March 2025 no. 33 (consolidated act on payments and collection), art. 10:
 *   equal monthly installments with interest, each by the 16th of the month; the plan
 *   must be completed by 16 December of the same year. Art. 11: deadlines falling
 *   between 1 and 20 August move to 20 August.
 *   (In force from 1/1/2026; previously art. 20 D.Lgs. 241/97 as amended by
 *   D.Lgs. 1/2024 art. 8, applicable from the 2023 balance.)
 * - Redditi PF 2026 instructions, booklet 1, "Rateazione": 4% annual interest,
 *   commercial method: 0.18% on the second installment, then +0.33% for each
 *   following one, paid separately (tax code 1668).
 *
 * The number of installments is NOT fixed: it depends on the first due date
 * (30/6 ordinary, 30/7 with 0.40% surcharge, or the date of a yearly extension).
 * That is why the computation always starts from the actual first date.
 */

export interface InstallmentPlanParams {
  /** Total amount to split, already increased by the surcharge when the deferral is used. */
  amount: number;
  /** Due date of the first installment (e.g. 2026-06-30, 2026-07-20 with the extension). */
  firstDueDate: Date;
  /** Number of installments chosen by the taxpayer; defaults to the maximum allowed. */
  installments?: number;
  /** Day of month for installments after the first (art. 10 par. 4: 16). */
  installmentDay?: number;
  /** Month/day by which the plan must be completed (art. 10 par. 1: 16 December). */
  end?: { month: number; day: number };
  /** Interest: percentage on the second installment and increment for each following one. */
  interest?: { secondInstallmentPct: number; incrementPct: number };
}

export interface Installment {
  number: number;
  dueDate: Date;
  principal: number;
  /** Interest percentage applied to the principal (0 on the first installment). */
  interestPct: number;
  interest: number;
  total: number;
}

const DEFAULT_INSTALLMENT_DAY = 16;
const DEFAULT_END = { month: 12, day: 16 };
const DEFAULT_INTEREST = { secondInstallmentPct: 0.18, incrementPct: 0.33 };

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/** Art. 11 D.Lgs. 33/2025: deadlines from 1 to 20 August are due by 20 August without surcharge. */
export function applyAugustDeferral(date: Date): Date {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  if (m === 8 && d >= 1 && d <= 20) {
    return utc(date.getUTCFullYear(), 8, 20);
  }
  return date;
}

/** Due dates after the first: the 16th of each following month, up to and including 16 December. */
export function maxInstallmentDates(
  firstDueDate: Date,
  installmentDay = DEFAULT_INSTALLMENT_DAY,
  end = DEFAULT_END,
): Date[] {
  const year = firstDueDate.getUTCFullYear();
  const limit = utc(year, end.month, end.day);
  if (firstDueDate.getTime() > limit.getTime()) {
    throw new Error('The first installment is later than the end of the installment period');
  }
  const out: Date[] = [firstDueDate];
  let month = firstDueDate.getUTCMonth() + 2; // next month (1-based)
  while (month <= end.month) {
    const due = applyAugustDeferral(utc(year, month, installmentDay));
    if (due.getTime() > limit.getTime()) break;
    out.push(due);
    month += 1;
  }
  return out;
}

export function maxInstallments(firstDueDate: Date): number {
  return maxInstallmentDates(firstDueDate).length;
}

export function buildInstallmentPlan(params: InstallmentPlanParams): Installment[] {
  const installmentDay = params.installmentDay ?? DEFAULT_INSTALLMENT_DAY;
  const end = params.end ?? DEFAULT_END;
  const interest = params.interest ?? DEFAULT_INTEREST;

  const dates = maxInstallmentDates(params.firstDueDate, installmentDay, end);
  const n = params.installments ?? dates.length;
  if (n < 1 || n > dates.length) {
    throw new Error(
      `Invalid number of installments: ${n} (max ${dates.length} starting from ${params.firstDueDate.toISOString().slice(0, 10)})`,
    );
  }

  const principal = round2(params.amount / n);
  const plan: Installment[] = [];
  let remaining = round2(params.amount);
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1;
    const p = isLast ? remaining : principal; // the last one absorbs rounding
    remaining = round2(remaining - p);
    const pct = i === 0 ? 0 : round2(interest.secondInstallmentPct + interest.incrementPct * (i - 1));
    const int = round2((p * pct) / 100);
    plan.push({
      number: i + 1,
      dueDate: dates[i],
      principal: p,
      interestPct: pct,
      interest: int,
      total: round2(p + int),
    });
  }
  return plan;
}
