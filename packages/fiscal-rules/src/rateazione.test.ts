import { describe, expect, it } from 'vitest';
import { calcolaPianoRateazione, numeroMassimoRate, scadenzeMassime } from './rateazione';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe('rateazione – prospetto ufficiale Istruzioni Redditi PF 2026, Fasc. 1, par. "Rateazione"', () => {
  it('prima rata 30 giugno: 7 rate, interessi 0 / 0,18 / 0,51 / 0,84 / 1,17 / 1,50 / 1,83', () => {
    const piano = calcolaPianoRateazione({ importo: 7000, primaRata: d('2026-06-30') });
    expect(piano.map((r) => iso(r.scadenza))).toEqual([
      '2026-06-30', '2026-07-16', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
    expect(piano.map((r) => r.interessePercentuale)).toEqual([0, 0.18, 0.51, 0.84, 1.17, 1.5, 1.83]);
  });

  it('prima rata 30 luglio (differimento +0,40%): 6 rate, seconda rata il 20 agosto con 0,18', () => {
    const piano = calcolaPianoRateazione({ importo: 6000, primaRata: d('2026-07-30') });
    expect(piano.map((r) => iso(r.scadenza))).toEqual([
      '2026-07-30', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
    expect(piano.map((r) => r.interessePercentuale)).toEqual([0, 0.18, 0.51, 0.84, 1.17, 1.5]);
  });
});

describe('rateazione – proroga forfettari 2026 (DL 89/2026 art. 6)', () => {
  it('prima rata 20 luglio 2026: 6 rate', () => {
    expect(numeroMassimoRate(d('2026-07-20'))).toBe(6);
    expect(scadenzeMassime(d('2026-07-20')).map(iso)).toEqual([
      '2026-07-20', '2026-08-20', '2026-09-16', '2026-10-16', '2026-11-16', '2026-12-16',
    ]);
  });

  it('prima rata 19 agosto 2026 (+0,80%): 5 rate', () => {
    expect(numeroMassimoRate(d('2026-08-19'))).toBe(5);
  });
});

describe('rateazione – importi', () => {
  it('quote uguali, ultima assorbe l\'arrotondamento, interessi separati', () => {
    const piano = calcolaPianoRateazione({ importo: 1000, primaRata: d('2026-06-30'), numeroRate: 3 });
    expect(piano.map((r) => r.quota)).toEqual([333.33, 333.33, 333.34]);
    expect(piano[1].interessi).toBe(0.6); // 333,33 × 0,18%
    expect(piano[2].interessi).toBe(1.7); // 333,34 × 0,51%
    expect(piano.reduce((s, r) => s + r.quota, 0)).toBeCloseTo(1000, 2);
  });

  it('rifiuta un numero di rate superiore al massimo', () => {
    expect(() => calcolaPianoRateazione({ importo: 100, primaRata: d('2026-07-20'), numeroRate: 7 })).toThrow();
  });
});
