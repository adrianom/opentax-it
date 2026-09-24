import { z } from 'zod';

/**
 * Registry of the official sources (docs/fonti/registro.json): one entry per document read,
 * with the archived copy and its SHA-256. Quotes in `sourceRefs` are verbatim excerpts of the
 * archived text; fragments are separated by "..." and checked one by one.
 */

export const SourceRecordSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  authority: z.string(),
  title: z.string(),
  kind: z.enum(['law', 'circular', 'resolution', 'instructions', 'specification', 'guide', 'table', 'web-page']),
  url: z.string().url(),
  /** Where the archived content is downloaded from, when it differs from `url` (e.g. the PDF of an INPS circular). */
  fetchUrl: z.string().url().optional(),
  /** Page to open first for its session cookie (Gazzetta Ufficiale articles). */
  sessionUrl: z.string().url().optional(),
  format: z.enum(['pdf', 'html', 'xls']),
  /** Opening-tag fragment of the element that holds the text of an HTML page. */
  contentSelector: z.string().optional(),
  /** Archived file, relative to docs/fonti; the hash covers this file. For HTML pages it is the extracted text. */
  file: z.string(),
  /** Extracted text of a PDF or XLS file, relative to docs/fonti. */
  text: z.string().optional(),
  retrievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export const SourceRegistrySchema = z.object({ sources: z.array(SourceRecordSchema) });

export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type SourceRegistry = z.infer<typeof SourceRegistrySchema>;

const QUOTE_MARKS = new Set(['’', '‘', "'", '`', '´', '"', '“', '”', '«', '»']);
const DASHES = new Set(['‐', '‑', '–', '—', '−']);

const HYPHEN_BREAK = /[ \t]*\n\s*(?=\p{L})/uy;
const LETTER = /\p{L}/u;
const SPACE = /\s/;
const MARK = /\p{M}/u;

/**
 * Text normalised for quote matching, with the index in `text` of the character each normalised
 * character comes from. Accents, apostrophes and quotation marks are removed (the Gazzetta
 * Ufficiale writes "attivita'" for "attività"), Normattiva's "((...))" amendment markers are
 * removed, dashes unified, words hyphenated across lines rejoined, whitespace collapsed.
 */
function normalizeWithMap(text: string): { chars: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  let last = '';
  const push = (c: string, at: number) => {
    if (SPACE.test(c)) {
      if (last === ' ') return;
      c = ' ';
    }
    for (const lower of c.toLowerCase()) {
      out.push(lower);
      map.push(at);
      last = lower;
    }
  };
  for (let i = 0; i < text.length; ) {
    const c = String.fromCodePoint(text.codePointAt(i)!);
    const next = i + c.length;
    if (c === '\u00ad') { i = next; continue; }
    if ((c === '(' || c === ')') && text[next] === c) { i = next + 1; continue; }
    if (c === '-' && LETTER.test(last)) {
      HYPHEN_BREAK.lastIndex = next;
      if (HYPHEN_BREAK.test(text)) { i = HYPHEN_BREAK.lastIndex; continue; }
    }
    for (const d of c.normalize('NFD')) {
      if (MARK.test(d) || QUOTE_MARKS.has(d)) continue;
      push(d === '°' || d === 'º' ? 'o' : DASHES.has(d) ? '-' : d, i);
    }
    i = next;
  }
  return { chars: out.join(''), map };
}

/** Text normalised for quote matching (see `normalizeWithMap`). */
export function normalizeForQuote(text: string): string {
  return normalizeWithMap(text).chars;
}

/** The verbatim fragments of a quote ("first part ... second part"). */
export function quoteFragments(quote: string): string[] {
  return quote.split(/\.\.\.|…/).map((f) => f.trim()).filter(Boolean);
}

export interface QuoteLocation {
  /** Ranges of the original text (end excluded), in the order of the fragments found. */
  ranges: Array<{ start: number; end: number }>;
  /** Fragments not found in the text. */
  missing: string[];
}

/** Locator of quotes in one text; the text is normalised once, so it can be reused for many quotes. */
export function quoteLocator(text: string): (quote: string) => QuoteLocation {
  const { chars, map } = normalizeWithMap(text);
  return (quote) => {
    const ranges: QuoteLocation['ranges'] = [];
    const missing: string[] = [];
    let from = 0;
    for (const fragment of quoteFragments(quote)) {
      const needle = normalizeForQuote(fragment).trim();
      // Fragments are usually in reading order; a quote may also list them out of order.
      let at = needle ? chars.indexOf(needle, from) : -1;
      if (at < 0 && needle) at = chars.indexOf(needle);
      if (at < 0) {
        missing.push(fragment);
        continue;
      }
      ranges.push({ start: map[at], end: map[at + needle.length - 1] + 1 });
      from = at + needle.length;
    }
    return { ranges, missing };
  };
}

/** Where `quote` is in `text`. */
export function locateQuote(text: string, quote: string): QuoteLocation {
  return quoteLocator(text)(quote);
}

/** Fragments of `quote` that do not appear in `text` (empty when the quote is verbatim). */
export function missingQuoteFragments(text: string, quote: string): string[] {
  return locateQuote(text, quote).missing;
}
