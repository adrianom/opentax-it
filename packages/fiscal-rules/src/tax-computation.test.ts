import { describe, expect, it } from 'vitest';
import { ruleSet2026 } from './rule-sets/2026';
import { computeTaxes, inpsAdvance, reducedRateApplies, substituteTaxAdvance, thresholdStatus } from './tax-computation';

const base = { year: 2025, atecoCode: '62.02', activityStartYear: 2024, reducedRateEligible: true, inpsRatePct: 26.07 };

describe('computeTaxes (LM section III, RR section II)', () => {
  it('income = revenue × 67%, contributions deducted within capacity, 5% in the reduced-rate window', () => {
    const r = computeTaxes(ruleSet2026, { ...base, collectedRevenue: 50_000, contributionsPaid: 4_000 });
    expect(r.coefficientPct).toBe(67);
    expect(r.grossIncome).toBe(33_500); // LM34
    expect(r.contributionsDeducted).toBe(4_000); // LM35 col. 2
    expect(r.netIncome).toBe(29_500); // LM36
    expect(r.taxRatePct).toBe(5);
    expect(r.substituteTax).toBe(1_475); // LM39
    expect(r.inpsTaxableIncome).toBe(33_500); // RR5 col. 11: gross income
    expect(r.inpsContribution).toBe(8_733); // 33,500 × 26.07% = 8,733.45 → whole euros (RR5 col. 15)
  });

  it('contributions exceeding the income are deducted only up to the income (LM35 col. 2 ≤ LM34)', () => {
    const r = computeTaxes(ruleSet2026, { ...base, collectedRevenue: 3_000, contributionsPaid: 5_000 });
    expect(r.grossIncome).toBe(2_010);
    expect(r.contributionsDeducted).toBe(2_010);
    expect(r.netIncome).toBe(0);
    expect(r.substituteTax).toBe(0);
  });

  it('INPS base is capped at the yearly ceiling (122,295 in 2026)', () => {
    const r = computeTaxes(ruleSet2026, { ...base, collectedRevenue: 200_000, contributionsPaid: 0, reducedRateEligible: false });
    expect(r.inpsTaxableIncome).toBe(122_295);
    expect(r.taxRatePct).toBe(15);
  });
});

describe('reducedRateApplies (par. 65: start year + 4)', () => {
  it('applies from the start year for five tax years, then stops', () => {
    expect(reducedRateApplies(ruleSet2026, 2024, 2024, true)).toBe(true);
    expect(reducedRateApplies(ruleSet2026, 2028, 2024, true)).toBe(true);
    expect(reducedRateApplies(ruleSet2026, 2029, 2024, true)).toBe(false);
    expect(reducedRateApplies(ruleSet2026, 2025, 2024, false)).toBe(false);
  });
});

describe('substituteTaxAdvance (Istr. RN62 via Circ. 10/E/2016 §4; DPR 435/2001 art. 17 par. 3)', () => {
  it('not due below 51.65', () => {
    expect(substituteTaxAdvance(ruleSet2026, 51).mode).toBe('NOT_DUE');
  });
  it('single instalment in November when the first would not exceed 103 (i.e. below 257.52 at 40%)', () => {
    expect(substituteTaxAdvance(ruleSet2026, 257)).toEqual({ total: 257, first: 0, second: 257, mode: 'SINGLE' });
    expect(substituteTaxAdvance(ruleSet2026, 258).mode).toBe('TWO_INSTALMENTS');
  });
  it('40% + 60% in the general case', () => {
    expect(substituteTaxAdvance(ruleSet2026, 1_475)).toEqual({ total: 1_475, first: 590, second: 885, mode: 'TWO_INSTALMENTS' });
  });
  it('50% + 50% for ISA subjects (DL 124/2019 art. 58; res. 93/E/2019): real 2026 form, tax 6,527 → 3,263.50', () => {
    expect(substituteTaxAdvance(ruleSet2026, 6_527, true)).toEqual({ total: 6_527, first: 3_263.5, second: 3_263.5, mode: 'TWO_INSTALMENTS' });
    expect(substituteTaxAdvance(ruleSet2026, 206, true).mode).toBe('SINGLE');
    expect(substituteTaxAdvance(ruleSet2026, 207, true).mode).toBe('TWO_INSTALMENTS');
  });
});

describe('inpsAdvance (L. 662/96 par. 212)', () => {
  it('80% of the contribution on this year income, in two equal instalments, at the next year rate', () => {
    expect(inpsAdvance(ruleSet2026, 33_500, 26.07)).toEqual({ total: 6_986.76, first: 3_493.38, second: 3_493.38, mode: 'TWO_INSTALMENTS' });
  });
  it('real 2026 form: contribution 11,342.99 → first advance 4,537.20', () => {
    const base = 11_342.99 / 0.2607;
    expect(inpsAdvance(ruleSet2026, base, 26.07).first).toBe(4_537.2);
  });
});

describe('rounding (Istr. Redditi PF 2026, "Modalità di arrotondamento")', () => {
  it('rounds every return row to the euro unit, half up', () => {
    const r = computeTaxes(ruleSet2026, { ...base, collectedRevenue: 12_345.67, contributionsPaid: 1_234.5 });
    expect(r.grossIncome).toBe(8_272); // 12,346 × 67% = 8,271.82
    expect(r.contributionsDeducted).toBe(1_235);
    expect(r.netIncome).toBe(7_037);
    expect(r.substituteTax).toBe(352); // 7,037 × 5% = 351.85
    // INPS base = LM34 (Circ. INPS 62/2026 §2.2), contribution RR5 col. 15 in whole euros.
    expect(r.inpsTaxableIncome).toBe(8_272);
    expect(r.inpsContribution).toBe(2_157); // 8,272 × 26.07% = 2,156.51
  });
});

describe('thresholdStatus (par. 54 / par. 71)', () => {
  it('flags 85,000 and 100,000', () => {
    expect(thresholdStatus(ruleSet2026, 84_000)).toMatchObject({ exceedsAccessThreshold: false, exceedsExitThreshold: false });
    expect(thresholdStatus(ruleSet2026, 90_000)).toMatchObject({ exceedsAccessThreshold: true, exceedsExitThreshold: false });
    expect(thresholdStatus(ruleSet2026, 100_000.01)).toMatchObject({ exceedsExitThreshold: true });
  });
});
