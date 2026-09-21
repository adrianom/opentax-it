import { describe, expect, it } from 'vitest';
import { buildDeadlines } from './deadlines';
import { ruleSet2026 } from './rule-sets/2026';

describe('deadlines 2026', () => {
  it('with the flat-rate extension: balance/advances on 20 July, second advance 30 November, filing 2 November', () => {
    const all = buildDeadlines(ruleSet2026, { applyExtension: true });
    const byKind = Object.fromEntries(all.map((x) => [x.kind, x]));
    expect(byKind.TAX_BALANCE.date).toBe('2026-07-20');
    expect(byKind.INPS_FIRST_ADVANCE.date).toBe('2026-07-20');
    expect(byKind.TAX_SECOND_ADVANCE.date).toBe('2026-11-30');
    expect(byKind.TAX_RETURN.date).toBe('2026-11-02');
    expect(byKind.TAX_BALANCE.code).toBe('1792');
    expect(byKind.TAX_SECOND_ADVANCE.code).toBe('1791');
    expect(byKind.INPS_BALANCE.code).toBe('PXX');
  });

  it('without the extension: 30 June', () => {
    expect(buildDeadlines(ruleSet2026).find((x) => x.kind === 'TAX_BALANCE')?.date).toBe('2026-06-30');
  });

  it('stamp duty: 4 deadlines; Q1 (31/5 Sunday) moves to 1/6, Q4 to 1/3/2027 (28/2 Sunday)', () => {
    const s = buildDeadlines(ruleSet2026).filter((x) => x.kind === 'STAMP_DUTY');
    expect(s.map((x) => x.date)).toEqual(['2026-06-01', '2026-09-30', '2026-11-30', '2027-03-01']);
    expect(s.map((x) => x.code)).toEqual(['2521', '2522', '2523', '2524']);
  });

  it('quarterly Intrastat: 25 April 2026 is a holiday and a Saturday → 27 April', () => {
    const i = buildDeadlines(ruleSet2026, { quarterlyIntrastat: true }).filter((x) => x.kind === 'INTRASTAT');
    expect(i.map((x) => x.date)).toEqual(['2026-04-27', '2026-07-27', '2026-10-26', '2027-01-25']);
  });

  it('is sorted by date', () => {
    const all = buildDeadlines(ruleSet2026, { applyExtension: true, quarterlyIntrastat: true });
    const dates = all.map((x) => x.date);
    expect([...dates].sort()).toEqual(dates);
  });
});
