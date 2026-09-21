import { describe, expect, it } from 'vitest';
import { parseIsoDate, toIsoDate } from './calendar';
import { buildPaymentSchedule, i24CancelBy, installmentCode } from './f24-schedule';
import { ruleSet2026 } from './rule-sets/2026';

const d = parseIsoDate;
const base = {
  taxYear: 2025,
  inpsOfficeCode: '5500',
  inpsReducedRate: false,
  secondAdvanceDate: d('2026-11-30'),
};

describe('buildPaymentSchedule – real 2026 forms (5 installments from 20 July, INPS office 5500)', () => {
  const { forms, warnings } = buildPaymentSchedule(ruleSet2026, {
    ...base,
    amounts: { taxBalance: 6527, taxFirstAdvance: 3263.5, taxSecondAdvance: 4895, inpsBalance: 6379.5, inpsFirstAdvance: 4537.2, inpsSecondAdvance: 4537 },
    firstDueDate: d('2026-07-20'),
    installments: 5,
  });

  it('produces five installment forms and the second advance', () => {
    expect(warnings).toEqual([]);
    expect(forms.map((f) => `${f.kind} ${toIsoDate(f.paymentDate)}`)).toEqual([
      'INSTALLMENT 2026-07-20',
      'INSTALLMENT 2026-08-20',
      'INSTALLMENT 2026-09-16',
      'INSTALLMENT 2026-10-16',
      'INSTALLMENT 2026-11-16',
      'SECOND_ADVANCE 2026-11-30',
    ]);
  });

  it('installment 3 of 5 matches the F24 prepared by the intermediary line by line', () => {
    const f = forms[2];
    expect(f.installmentNumber).toBe(3);
    expect(f.installmentsTotal).toBe(5);
    const rows = f.lines.map((l) => [l.section, l.code, l.installmentCode ?? '', l.officeCode ?? '', l.periodFrom ?? '', l.periodTo ?? '', l.referenceYear, l.debitAmount]);
    expect(rows).toEqual([
      ['TREASURY', '1792', '0305', '', '', '', 2025, 1305.4],
      ['TREASURY', '1790', '0305', '', '', '', 2026, 652.7],
      ['INPS', 'PXXR', '', '5500', '01/2025', '12/2025', 2025, 1275.9],
      ['INPS', 'PXXR', '', '5500', '01/2026', '12/2026', 2026, 907.44],
      ['TREASURY', '1668', '', '', '', '', 2025, 8.09],
      ['TREASURY', '1668', '', '', '', '', 2026, 4.05],
      ['INPS', 'DPPI', '', '5500', '01/2025', '12/2025', 2025, 7.91],
      ['INPS', 'DPPI', '', '5500', '01/2026', '12/2026', 2026, 5.63],
    ]);
    expect(f.totalDebit).toBe(4167.12); // 1,970.24 (Erario) + 2,196.88 (INPS)
  });

  it('installment 4 of 5: interest 12.40 / 6.20 / 12.12 / 8.62 as on the second real form', () => {
    const f = forms[3];
    const interest = f.lines.filter((l) => l.code === '1668' || l.code === 'DPPI').map((l) => l.debitAmount);
    expect(interest).toEqual([12.4, 6.2, 12.12, 8.62]);
    expect(f.lines[0].installmentCode).toBe('0405');
  });

  it('first installment matches the real first form (paid early on 29/6): no interest rows, total 4,141.44', () => {
    expect(forms[0].lines.map((l) => [l.code, l.installmentCode ?? '', l.referenceYear, l.debitAmount])).toEqual([
      ['1792', '0105', 2025, 1305.4],
      ['1790', '0105', 2026, 652.7],
      ['PXXR', '', 2025, 1275.9],
      ['PXXR', '', 2026, 907.44],
    ]);
    expect(forms[0].totalDebit).toBe(4141.44); // 1,958.10 (Erario) + 2,183.34 (INPS)
  });

  it('second advance: 1791 and PXX without installment code, reference year 2026', () => {
    const f = forms[5];
    expect(f.lines.map((l) => [l.code, l.installmentCode, l.referenceYear, l.periodFrom, l.debitAmount])).toEqual([
      ['1791', undefined, 2026, undefined, 4895],
      ['PXX', undefined, 2026, '01/2026', 4537],
    ]);
  });

  it('I24 cancellation: third-to-last business day before the debit date', () => {
    expect(toIsoDate(forms[2].i24CancelBy)).toBe('2026-09-11'); // Wed 16/9 → Tue 15, Mon 14, Fri 11
    expect(toIsoDate(i24CancelBy(d('2026-11-30')))).toBe('2026-11-25'); // Mon 30/11 → Fri 27, Thu 26, Wed 25
  });
});

describe('buildPaymentSchedule – single payment', () => {
  it('uses 0101 for 1790/1792, PXX for INPS and no interest rows', () => {
    const { forms } = buildPaymentSchedule(ruleSet2026, {
      ...base,
      amounts: { taxBalance: 1000, taxFirstAdvance: 400, taxSecondAdvance: 600, inpsBalance: 0, inpsFirstAdvance: 500, inpsSecondAdvance: 500 },
      firstDueDate: d('2026-06-30'),
      installments: 1,
    });
    expect(forms).toHaveLength(2);
    expect(forms[0].kind).toBe('BALANCE');
    expect(forms[0].lines.map((l) => [l.code, l.installmentCode, l.debitAmount])).toEqual([
      ['1792', '0101', 1000],
      ['1790', '0101', 400],
      ['PXX', undefined, 500],
    ]);
    expect(forms[0].totalDebit).toBe(1900);
  });

  it('applies the 0.40% surcharge before splitting when the deferred date is used', () => {
    const { forms } = buildPaymentSchedule(ruleSet2026, {
      ...base,
      amounts: { taxBalance: 1000, taxFirstAdvance: 0, taxSecondAdvance: 0, inpsBalance: 0, inpsFirstAdvance: 0, inpsSecondAdvance: 0 },
      firstDueDate: d('2026-07-30'),
      surchargePct: 0.4,
      installments: 2,
    });
    expect(forms[0].lines[0].debitAmount).toBe(502);
    expect(forms[1].lines[0].debitAmount).toBe(502);
    expect(forms[1].lines[1]).toMatchObject({ code: '1668', debitAmount: 0.9 }); // 502 × 0.18%
  });

  it('warns about lines below the EUR 1.03 minimum and uses P10/P10R at the 24% rate', () => {
    const { forms, warnings } = buildPaymentSchedule(ruleSet2026, {
      ...base,
      inpsReducedRate: true,
      amounts: { taxBalance: 0, taxFirstAdvance: 0, taxSecondAdvance: 0, inpsBalance: 100, inpsFirstAdvance: 0, inpsSecondAdvance: 0 },
      firstDueDate: d('2026-06-30'),
      installments: 2,
    });
    expect(forms[1].lines.map((l) => l.code)).toEqual(['P10R', 'DPPI']);
    expect(warnings).toHaveLength(1);
  });

  it('installmentCode pads to NNRR', () => {
    expect(installmentCode(2, 6)).toBe('0206');
  });
});
