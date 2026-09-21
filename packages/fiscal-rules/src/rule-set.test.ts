import { describe, expect, it } from 'vitest';
import { parseFiscalRuleSet, profitabilityCoefficient } from './rule-set';
import { ruleSet2026 } from './rule-sets/2026';

describe('FiscalRuleSet 2026', () => {
  it('matches the schema', () => {
    expect(() => parseFiscalRuleSet(ruleSet2026)).not.toThrow();
  });

  it('has an official source for every main section', () => {
    for (const key of ['flatRate.revenueThreshold', 'advancePayment', 'installments', 'inps.fullRatePct', 'stampDuty', 'taxCodes', 'inpsReasons', 'eInvoice']) {
      expect(ruleSet2026.sourceRefs[key]?.url).toMatch(/^https:\/\/(www\.)?(agenziaentrate\.gov\.it|normattiva\.it|gazzettaufficiale\.it|inps\.it|adm\.gov\.it)/);
    }
  });

  it('ATECO coefficients: 62.02 → 67%, 46.1 → 62%, 46.21 → 40%, 47.81 → 40%, 47.82 → 54%, 69 → 78%', () => {
    expect(profitabilityCoefficient(ruleSet2026, '62.02')).toBe(67);
    expect(profitabilityCoefficient(ruleSet2026, '62.02.00')).toBe(67);
    expect(profitabilityCoefficient(ruleSet2026, '46.1')).toBe(62);
    expect(profitabilityCoefficient(ruleSet2026, '46.21')).toBe(40);
    expect(profitabilityCoefficient(ruleSet2026, '47.81')).toBe(40);
    expect(profitabilityCoefficient(ruleSet2026, '47.82')).toBe(54);
    expect(profitabilityCoefficient(ruleSet2026, '69.20.11')).toBe(78);
    expect(() => profitabilityCoefficient(ruleSet2026, '04')).toThrow();
  });
});
