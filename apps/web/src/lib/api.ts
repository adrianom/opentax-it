const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export interface Deadline {
  kind: string;
  nominalDate: string;
  date: string;
  description: string;
  details: { taxYear: number; percentage?: number; quarter?: number; splittable?: boolean };
  code?: string;
  source?: string;
}

export interface RuleSetSummary {
  id: string;
  year: number;
  version: number;
  status: 'DRAFT' | 'PROPOSED' | 'ACTIVE' | 'SUPERSEDED';
  activatedAt: string | null;
  notes: string | null;
}

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function fetchDeadlines(year: number, opts: { intrastat?: boolean } = {}) {
  const q = new URLSearchParams({ extension: 'true', intrastat: String(opts.intrastat ?? false) });
  return get<Deadline[]>(`/fiscal-rules/${year}/deadlines?${q}`);
}

export function fetchRuleSets(year: number) {
  return get<RuleSetSummary[]>(`/fiscal-rules/${year}`);
}
