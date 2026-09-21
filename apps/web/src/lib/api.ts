import 'server-only';
import { cookies } from 'next/headers';
import type { Customer, Deadline, Invoice, Payment, RuleSetSummary, TaxSummary, TaxYearData, Tenant, TenantWithProfile } from './types';

export * from './types';
export * from './format';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const TENANT_COOKIE = 'opentax_tenant';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function currentTenantId(): Promise<string | null> {
  const store = await cookies();
  return store.get(TENANT_COOKIE)?.value ?? null;
}

async function request<T>(path: string, init: RequestInit = {}, tenantId?: string | null): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers['content-type'] = 'application/json';
  if (tenantId) headers['x-tenant-id'] = tenantId;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join('; ') : (body?.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return body as T;
}

/** Requests that need a tenant; the tenant id comes from the cookie set on /setup. */
export async function tenantRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tenantId = await currentTenantId();
  if (!tenantId) throw new ApiError(400, 'Nessun tenant selezionato');
  return request<T>(path, init, tenantId);
}

export async function fetchOrNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) return null;
    throw e;
  }
}

export const api = {
  tenants: () => request<Tenant[]>('/tenants'),
  me: () => tenantRequest<TenantWithProfile>('/tenants/me'),
  updateMe: (data: unknown) => tenantRequest<TenantWithProfile>('/tenants/me', { method: 'PUT', body: JSON.stringify(data) }),
  activateRuleSet: (id: string) => request<RuleSetSummary>(`/fiscal-rules/${id}/activate`, { method: 'POST' }),
  seedRuleSets: () => request<{ inserted: Array<{ year: number; version: number }> }>('/fiscal-rules/seed', { method: 'POST' }),
  inpsOffices: () => request<Array<{ id: string; code: string; name: string }>>('/tenants/inps-offices'),
  createTenant: (data: unknown) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  ruleSets: (year: number) => request<RuleSetSummary[]>(`/fiscal-rules/${year}`),
  ruleSetStatus: (year: number) => request<{ year: number; ok: boolean; reason?: string }>(`/fiscal-rules/${year}/status`),
  /** With a selected tenant the calendar is derived from its profile and invoices (stamp duty, Intrastat). */
  deadlines: async (year: number) => {
    const tenantId = await currentTenantId();
    return request<Deadline[]>(`/fiscal-rules/${year}/deadlines?extension=true`, {}, tenantId);
  },
  customers: () => tenantRequest<Customer[]>('/customers'),
  customer: (id: string) => tenantRequest<Customer>(`/customers/${id}`),
  createCustomer: (data: unknown) => tenantRequest<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: unknown) => tenantRequest<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => tenantRequest<void>(`/customers/${id}`, { method: 'DELETE' }),
  invoices: (year?: number) => tenantRequest<Invoice[]>(`/invoices${year ? `?year=${year}` : ''}`),
  invoice: (id: string) => tenantRequest<Invoice>(`/invoices/${id}`),
  createInvoice: (data: unknown) => tenantRequest<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => tenantRequest<void>(`/invoices/${id}`, { method: 'DELETE' }),
  issueInvoice: (id: string, data: unknown) => tenantRequest<Invoice>(`/invoices/${id}/issue`, { method: 'POST', body: JSON.stringify(data) }),
  payments: (invoiceId: string) => tenantRequest<Payment[]>(`/invoices/${invoiceId}/payments`),
  createPayment: (invoiceId: string, data: unknown) => tenantRequest<Payment>(`/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id: string) => tenantRequest<void>(`/payments/${id}`, { method: 'DELETE' }),
  taxSummary: (year: number) => tenantRequest<TaxSummary>(`/taxes/${year}/summary`),
  taxYearData: (year: number) => tenantRequest<TaxYearData>(`/taxes/${year}/data`),
  updateTaxYearData: (year: number, data: unknown) => tenantRequest<TaxYearData>(`/taxes/${year}/data`, { method: 'PUT', body: JSON.stringify(data) }),
  invoiceXml: async (id: string) => {
    const tenantId = await currentTenantId();
    const res = await fetch(`${API_URL}/invoices/${id}/xml`, { headers: tenantId ? { 'x-tenant-id': tenantId } : {}, cache: 'no-store' });
    if (!res.ok) throw new ApiError(res.status, 'XML non disponibile');
    return { fileName: res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'invoice.xml', content: await res.text() };
  },
};

