import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { FiscalRuleSet } from './rule-set';
import { ruleSet2025 } from './rule-sets/2025';
import { ruleSet2026 } from './rule-sets/2026';
import { locateQuote, missingQuoteFragments, normalizeForQuote, quoteFragments, quoteLocator, SourceRegistrySchema } from './sources';

const DIR = fileURLToPath(new URL('../../../docs/fonti/', import.meta.url));
const registry = SourceRegistrySchema.parse(JSON.parse(readFileSync(DIR + 'registro.json', 'utf8')));
const byId = new Map(registry.sources.map((s) => [s.id, s]));
const locators = new Map<string, ReturnType<typeof quoteLocator>>();
/** Locator on the archived text of a source, built once per source. */
const locatorOf = (id: string) => {
  if (!locators.has(id)) locators.set(id, quoteLocator(readFileSync(DIR + (byId.get(id)!.text ?? byId.get(id)!.file), 'utf8')));
  return locators.get(id)!;
};

describe('quote matching', () => {
  it('ignores accents written as apostrophes, Normattiva markers, dashes and line breaks', () => {
    expect(normalizeForQuote("attivita' economiche")).toBe(normalizeForQuote('attività economiche'));
    expect(missingQuoteFragments('sanzione ((pari al venticinque)) per\ncento', 'sanzione pari al venticinque per cento')).toEqual([]);
    expect(missingQuoteFragments('1792: imposta – saldo', '1792: imposta - saldo')).toEqual([]);
    expect(missingQuoteFragments('entro il sessan-\ntesimo giorno', 'entro il sessantesimo giorno')).toEqual([]);
  });

  it('checks every fragment separately', () => {
    expect(quoteFragments('primo ... secondo … terzo')).toEqual(['primo', 'secondo', 'terzo']);
    expect(missingQuoteFragments('primo e poi secondo', 'primo ... terzo')).toEqual(['terzo']);
  });

  it('locates the fragments in the original text', () => {
    const text = "Il versamento e' dovuto ((entro il)) 30\ngiugno. Poi l'acconto.";
    const { ranges, missing } = locateQuote(text, 'versamento è dovuto entro il 30 giugno ... acconto');
    expect(missing).toEqual([]);
    expect(ranges.map((r) => text.slice(r.start, r.end))).toEqual(["versamento e' dovuto ((entro il)) 30\ngiugno", 'acconto']);
  });
});

describe('source registry', () => {
  it('has unique ids and official domains', () => {
    expect(byId.size).toBe(registry.sources.length);
    for (const s of registry.sources) {
      for (const url of [s.url, s.fetchUrl, s.sessionUrl].filter(Boolean) as string[]) {
        expect(new URL(url).hostname, s.id).toMatch(/(^|\.)(agenziaentrate\.gov\.it|normattiva\.it|gazzettaufficiale\.it|inps\.it|adm\.gov\.it|fatturapa\.gov\.it)$/);
      }
    }
  });

  it('archived files exist and match their SHA-256', () => {
    for (const s of registry.sources) {
      const hash = createHash('sha256').update(readFileSync(DIR + s.file)).digest('hex');
      expect(hash, s.id).toBe(s.sha256);
      if (s.text) expect(existsSync(DIR + s.text), s.id).toBe(true);
    }
  });
});

/**
 * Entries that are not a value of the rule set: the INPS reasons table as a whole, and the rule
 * (applied in `inpsAdvance`) that the INPS advance uses the rates of the following year.
 */
const DOCUMENT_KEYS = new Set(['inpsReasons.table', 'inps.advanceRateYear']);

/** Dotted paths of the values of a rule set; the ATECO table counts as one value. */
function fieldPaths(rules: FiscalRuleSet): Map<string, unknown> {
  const { year: _year, sourceRefs: _refs, ...data } = rules;
  const out = new Map<string, unknown>();
  const walk = (value: unknown, path: string) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !path.endsWith('profitabilityByAteco')) {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    } else out.set(path, value);
  };
  walk(data, '');
  return out;
}

/**
 * Sections whose entry quotes one passage with all their values (e.g. the four tax codes in one
 * list of the instructions). Any other field needs its own entry.
 */
const SECTION_KEYS = new Set([
  'deadlines.installmentsEnd', 'deadlines.augustDeferral', 'installments', 'stampDuty', 'taxCodes', 'inpsReasons',
  'eInvoice', 'taxNotices', 'taxNotices.summerSuspension', 'penalties', 'intrastat',
]);

/** The sourceRefs key covering a field: its own entry or the entry of a section in SECTION_KEYS. */
const refKeyFor = (rules: FiscalRuleSet, path: string) =>
  path in rules.sourceRefs
    ? path
    : Object.keys(rules.sourceRefs).filter((k) => SECTION_KEYS.has(k) && path.startsWith(`${k}.`)).sort((a, b) => b.length - a.length)[0];

describe.each([ruleSet2025, ruleSet2026] as FiscalRuleSet[])('sourceRefs of rule set $year', (rules) => {
  const refs = Object.entries(rules.sourceRefs);
  const fields = fieldPaths(rules);

  it('cover every field, with its own entry or the entry of a listed section', () => {
    expect([...fields.keys()].filter((path) => !refKeyFor(rules, path))).toEqual([]);
  });

  it('are keyed by fields or sections of the rule set', () => {
    const paths = [...fields.keys()];
    expect(refs.map(([key]) => key).filter((key) => !DOCUMENT_KEYS.has(key) && !paths.some((p) => p === key || p.startsWith(`${key}.`)))).toEqual([]);
  });

  it('point to a registered source with the same URL', () => {
    for (const [key, ref] of refs) {
      const source = ref.sourceId ? byId.get(ref.sourceId) : undefined;
      expect(source, `${key}: sourceId ${ref.sourceId}`).toBeDefined();
      expect([source!.url, source!.fetchUrl], key).toContain(ref.url);
      for (const extra of ref.additional ?? []) expect(byId.has(extra.sourceId), `${key}: ${extra.sourceId}`).toBe(true);
    }
  });

  it('quote the archived text verbatim', () => {
    const missing: Record<string, string[]> = {};
    for (const [key, ref] of refs) {
      for (const { sourceId, quote } of [{ sourceId: ref.sourceId!, quote: ref.quote }, ...(ref.additional ?? [])]) {
        const fragments = locatorOf(sourceId)(quote).missing;
        if (fragments.length > 0) missing[`${key} (${sourceId})`] = fragments;
      }
    }
    expect(missing).toEqual({});
  });
});

describe('rule set 2025 derived from 2026', () => {
  it('has its own source for every value that differs from 2026', () => {
    const fields2026 = fieldPaths(ruleSet2026);
    const inherited = [...fieldPaths(ruleSet2025)]
      .filter(([path, value]) => JSON.stringify(value) !== JSON.stringify(fields2026.get(path)))
      .filter(([path]) => ruleSet2025.sourceRefs[refKeyFor(ruleSet2025, path)] === ruleSet2026.sourceRefs[refKeyFor(ruleSet2026, path)])
      .map(([path]) => path);
    expect(inherited).toEqual([]);
  });
});
