import type { Customer } from './types';

export function customerLabel(c: Pick<Customer, 'businessName' | 'firstName' | 'lastName'>): string {
  return c.businessName ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** "Rivalsa INPS 4%" with the rate of the year's rule set; without the rate when the set is not available. */
export function inpsSurchargeLabel(ratePct?: number): string {
  return ratePct == null ? 'Rivalsa INPS' : `Rivalsa INPS ${ratePct.toLocaleString('it-IT')}%`;
}

/** Percentage in Italian notation, e.g. 26.07 → "26,07%". */
export function formatPct(value: number): string {
  return `${value.toLocaleString('it-IT')}%`;
}

export function formatMoney(value: string | number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(Number(value));
}

/** Years from `from` to `to`, newest first, always including `selected` (e.g. a year typed in the URL). */
export function yearRange(from: number, to: number, selected?: number): number[] {
  const years = new Set(Array.from({ length: to - from + 1 }, (_, i) => to - i));
  if (selected !== undefined) years.add(selected);
  return [...years].sort((a, b) => b - a);
}
