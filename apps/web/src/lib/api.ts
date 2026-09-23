import 'server-only';
import { cookies } from 'next/headers';
import type { BankAccount, CourtesyInvoice, Customer, Deadline, F24, ImportResult, InstallmentPlan, Invoice, InvoiceDetail, Payment, PaymentTerms, PlanOptions, PlanPreview, RuleSetSummary, TaxCredit, TaxSummary, TaxYearData, Tenant, TenantWithProfile } from './types';

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
  bankAccounts: () => tenantRequest<BankAccount[]>('/tenants/me/bank-accounts'),
  saveBankAccount: (data: unknown, id?: string) => tenantRequest<BankAccount>(id ? `/tenants/me/bank-accounts/${id}` : '/tenants/me/bank-accounts', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  deleteBankAccount: (id: string) => tenantRequest<void>(`/tenants/me/bank-accounts/${id}`, { method: 'DELETE' }),
  paymentTerms: () => tenantRequest<PaymentTerms[]>('/tenants/me/payment-terms'),
  savePaymentTerms: (data: unknown, id?: string) => tenantRequest<PaymentTerms>(id ? `/tenants/me/payment-terms/${id}` : '/tenants/me/payment-terms', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  deletePaymentTerms: (id: string) => tenantRequest<void>(`/tenants/me/payment-terms/${id}`, { method: 'DELETE' }),
  activateRuleSet: (id: string) => request<RuleSetSummary>(`/fiscal-rules/${id}/activate`, { method: 'POST' }),
  seedRuleSets: () => request<{ inserted: Array<{ year: number; version: number }> }>('/fiscal-rules/seed', { method: 'POST' }),
  inpsOffices: () => request<Array<{ id: string; code: string; name: string }>>('/tenants/inps-offices'),
  createTenant: (data: unknown) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  ruleSets: (year: number) => request<RuleSetSummary[]>(`/fiscal-rules/${year}`),
  /** Only the fields the web needs from the active rule set of the year. */
  activeRules: (year: number) => request<{ inps: { surchargePct: number; fullRatePct: number; reducedRatePct: number }; installments: { annualInterestPct: number; incrementPct: number } }>(`/fiscal-rules/${year}/active`),
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
  invoice: (id: string) => tenantRequest<InvoiceDetail>(`/invoices/${id}`),
  invoicePreview: (id: string) => tenantRequest<CourtesyInvoice>(`/invoices/${id}/preview`),
  createInvoice: (data: unknown) => tenantRequest<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: unknown) => tenantRequest<Invoice>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => tenantRequest<void>(`/invoices/${id}`, { method: 'DELETE' }),
  issueInvoice: (id: string, data: unknown) => tenantRequest<Invoice>(`/invoices/${id}/issue`, { method: 'POST', body: JSON.stringify(data) }),
  payments: (invoiceId: string) => tenantRequest<Payment[]>(`/invoices/${invoiceId}/payments`),
  createPayment: (invoiceId: string, data: unknown) => tenantRequest<Payment>(`/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id: string) => tenantRequest<void>(`/payments/${id}`, { method: 'DELETE' }),
  taxSummary: (year: number) => tenantRequest<TaxSummary>(`/taxes/${year}/summary`),
  taxYearData: (year: number) => tenantRequest<TaxYearData>(`/taxes/${year}/data`),
  updateTaxYearData: (year: number, data: unknown) => tenantRequest<TaxYearData>(`/taxes/${year}/data`, { method: 'PUT', body: JSON.stringify(data) }),
  taxCredits: () => tenantRequest<TaxCredit[]>('/taxes/credits'),
  createTaxCredit: (data: unknown) => tenantRequest<TaxCredit>('/taxes/credits', { method: 'POST', body: JSON.stringify(data) }),
  deleteTaxCredit: (id: string) => tenantRequest<void>(`/taxes/credits/${id}`, { method: 'DELETE' }),
  f24s: (year: number) => tenantRequest<F24[]>(`/f24?year=${year}`),
  f24: (id: string) => tenantRequest<F24>(`/f24/${id}`),
  planOptions: (taxYear: number) => tenantRequest<PlanOptions>(`/f24/plans/${taxYear}/options`),
  plan: (taxYear: number) => tenantRequest<InstallmentPlan>(`/f24/plans/${taxYear}`),
  previewPlan: (taxYear: number, data: unknown) => tenantRequest<PlanPreview>(`/f24/plans/${taxYear}/preview`, { method: 'POST', body: JSON.stringify(data) }),
  createPlan: (taxYear: number, data: unknown) => tenantRequest<InstallmentPlan>(`/f24/plans/${taxYear}`, { method: 'POST', body: JSON.stringify(data) }),
  deletePlan: (taxYear: number) => tenantRequest<void>(`/f24/plans/${taxYear}`, { method: 'DELETE' }),
  updateF24Status: (id: string, data: unknown) => tenantRequest<F24>(`/f24/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  importInvoices: (files: Array<{ name: string; xml: string }>) => tenantRequest<ImportResult[]>('/invoices/import', { method: 'POST', body: JSON.stringify({ files }) }),
  f24Pdf: async (id: string) => {
    const tenantId = await currentTenantId();
    const res = await fetch(`${API_URL}/f24/${id}/pdf`, { headers: tenantId ? { 'x-tenant-id': tenantId } : {}, cache: 'no-store' });
    if (!res.ok) throw new ApiError(res.status, 'PDF non disponibile');
    return { fileName: res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'f24.pdf', content: await res.arrayBuffer() };
  },
  invoicePdf: async (id: string) => {
    const tenantId = await currentTenantId();
    const res = await fetch(`${API_URL}/invoices/${id}/pdf`, { headers: tenantId ? { 'x-tenant-id': tenantId } : {}, cache: 'no-store' });
    if (!res.ok) throw new ApiError(res.status, 'PDF non disponibile');
    return { fileName: res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'fattura.pdf', content: await res.arrayBuffer() };
  },
  invoiceXml: async (id: string) => {
    const tenantId = await currentTenantId();
    const res = await fetch(`${API_URL}/invoices/${id}/xml`, { headers: tenantId ? { 'x-tenant-id': tenantId } : {}, cache: 'no-store' });
    if (!res.ok) throw new ApiError(res.status, 'XML non disponibile');
    return { fileName: res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'invoice.xml', content: await res.text() };
  },
};

