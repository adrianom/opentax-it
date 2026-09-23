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

export function formatMoney(value: string | number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(Number(value));
}
