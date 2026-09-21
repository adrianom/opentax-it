import { describe, expect, it } from 'vitest';
import { buildInstallmentPlan, maxInstallmentDates, maxInstallments } from './installment-plan';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe('installment plan – official table, Redditi PF 2026 instructions, booklet 1, "Rateazione"', () => {
  it('first installment 30 June: 7 installments, interest 0 / 0.18 / 0.51 / 0.84 / 1.17 / 1.50 / 1.83', () => {
    const plan = buildInstallmentPlan({ amount: 7000, firstDueDate: d('2026-06-30') });
    expect(plan.map((r) => iso(r.dueDate))).toEqual([
      '2026-06-30', '2026-07-16', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
    expect(plan.map((r) => r.interestPct)).toEqual([0, 0.18, 0.51, 0.84, 1.17, 1.5, 1.83]);
  });

  it('first installment 30 July (deferral +0.40%): 6 installments, second on 20 August with 0.18', () => {
    const plan = buildInstallmentPlan({ amount: 6000, firstDueDate: d('2026-07-30') });
    expect(plan.map((r) => iso(r.dueDate))).toEqual([
      '2026-07-30', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
    expect(plan.map((r) => r.interestPct)).toEqual([0, 0.18, 0.51, 0.84, 1.17, 1.5]);
  });
});

describe('installment plan – 2026 flat-rate extension (DL 89/2026 art. 6)', () => {
  it('first installment 20 July 2026: 6 installments', () => {
    expect(maxInstallments(d('2026-07-20'))).toBe(6);
    expect(maxInstallmentDates(d('2026-07-20')).map(iso)).toEqual([
      '2026-07-20', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
  });

  it('first installment 19 August 2026 (+0.80%): 5 installments', () => {
    expect(maxInstallments(d('2026-08-19'))).toBe(5);
  });
});

describe('installment plan – amounts', () => {
  it('equal principals, the last absorbs rounding, interest kept separate', () => {
    const plan = buildInstallmentPlan({ amount: 1000, firstDueDate: d('2026-06-30'), installments: 3 });
    expect(plan.map((r) => r.principal)).toEqual([333.33, 333.33, 333.34]);
    expect(plan[1].interest).toBe(0.6); // 333.33 × 0.18%
    expect(plan[2].interest).toBe(1.7); // 333.34 × 0.51%
    expect(plan.reduce((s, r) => s + r.principal, 0)).toBeCloseTo(1000, 2);
  });

  it('rejects more installments than allowed', () => {
    expect(() => buildInstallmentPlan({ amount: 100, firstDueDate: d('2026-07-20'), installments: 7 })).toThrow();
  });
});
