import type { Customer } from './types';

export function customerLabel(c: Pick<Customer, 'businessName' | 'firstName' | 'lastName'>): string {
  return c.businessName ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function formatMoney(value: string | number, currency = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(Number(value));
}
