'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError, TENANT_COOKIE } from './api';

export type ActionState = { error?: string } | undefined;

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Errore inatteso';
}

export async function selectTenant(formData: FormData) {
  const id = String(formData.get('tenantId') ?? '');
  const store = await cookies();
  store.set(TENANT_COOKIE, id, { path: '/', sameSite: 'lax' });
  redirect('/invoices');
}

export async function createTenant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    const tenant = await api.createTenant({
      name: f('name'),
      businessName: f('businessName') || undefined,
      firstName: f('firstName'),
      lastName: f('lastName'),
      fiscalCode: f('fiscalCode').toUpperCase(),
      vatNumber: f('vatNumber'),
      atecoCode: f('atecoCode'),
      address: f('address'),
      postalCode: f('postalCode'),
      city: f('city'),
      province: f('province').toUpperCase(),
      activityStartYear: Number(f('activityStartYear')),
      reducedRate: formData.get('reducedRate') === 'on',
      applyInpsSurcharge: formData.get('applyInpsSurcharge') === 'on',
      viesRegistered: formData.get('viesRegistered') === 'on',
      inpsOfficeId: f('inpsOfficeId') || undefined,
      pecAddress: f('pecAddress') || undefined,
    });
    const store = await cookies();
    store.set(TENANT_COOKIE, tenant.id, { path: '/', sameSite: 'lax' });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  redirect('/invoices');
}

export async function saveCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  const id = f('id');
  const kind = f('kind');
  const foreign = kind === 'EU' || kind === 'NON_EU';
  const data = {
    kind,
    businessName: f('businessName') || undefined,
    firstName: f('firstName') || undefined,
    lastName: f('lastName') || undefined,
    vatNumber: f('vatNumber') || undefined,
    fiscalCode: f('fiscalCode').toUpperCase() || undefined,
    countryCode: foreign ? f('countryCode').toUpperCase() || undefined : 'IT',
    address: f('address'),
    postalCode: f('postalCode') || undefined,
    city: f('city'),
    province: foreign ? undefined : f('province').toUpperCase() || undefined,
    recipientCode: f('recipientCode').toUpperCase() || undefined,
    recipientPec: f('recipientPec') || undefined,
    currency: f('currency').toUpperCase() || undefined,
    notes: f('notes') || undefined,
  };
  try {
    if (id) await api.updateCustomer(id, data);
    else await api.createCustomer(data);
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/customers');
  redirect('/customers');
}

export async function deleteCustomer(formData: FormData) {
  await api.deleteCustomer(String(formData.get('id')));
  revalidatePath('/customers');
}

export interface InvoiceInput {
  customerId: string;
  type: 'TD01' | 'TD04';
  refInvoiceId?: string;
  date: string;
  applyInpsSurcharge?: boolean;
  lines: Array<{ description: string; quantity: number; unit?: string; unitPrice: number }>;
}

export async function createInvoice(input: InvoiceInput): Promise<{ id?: string; error?: string }> {
  try {
    const inv = await api.createInvoice({ ...input, refInvoiceId: input.refInvoiceId || undefined });
    revalidatePath('/invoices');
    return { id: inv.id };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function issueInvoice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id'));
  const dueDate = String(formData.get('dueDate') ?? '').trim();
  const iban = String(formData.get('iban') ?? '').trim();
  try {
    await api.issueInvoice(id, { payment: dueDate || iban ? { dueDate: dueDate || undefined, iban: iban || undefined, method: 'MP05' } : undefined });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  return undefined;
}

export async function deleteInvoice(formData: FormData) {
  await api.deleteInvoice(String(formData.get('id')));
  revalidatePath('/invoices');
  redirect('/invoices');
}

export async function updateTenantProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    await api.updateMe({
      name: f('name') || undefined,
      businessName: f('businessName') || undefined,
      firstName: f('firstName') || undefined,
      lastName: f('lastName') || undefined,
      fiscalCode: f('fiscalCode').toUpperCase() || undefined,
      vatNumber: f('vatNumber') || undefined,
      atecoCode: f('atecoCode') || undefined,
      address: f('address') || undefined,
      postalCode: f('postalCode') || undefined,
      city: f('city') || undefined,
      province: f('province').toUpperCase() || undefined,
      activityStartYear: f('activityStartYear') ? Number(f('activityStartYear')) : undefined,
      reducedRate: formData.get('reducedRate') === 'on',
      applyInpsSurcharge: formData.get('applyInpsSurcharge') === 'on',
      viesRegistered: formData.get('viesRegistered') === 'on',
      pecAddress: f('pecAddress') || undefined,
      inpsOfficeId: f('inpsOfficeId'),
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/setup');
  return undefined;
}

export async function activateRuleSet(formData: FormData) {
  await api.activateRuleSet(String(formData.get('id')));
  revalidatePath('/setup');
  revalidatePath('/dashboard');
  revalidatePath('/deadlines');
}

export async function seedRuleSets() {
  await api.seedRuleSets();
  revalidatePath('/setup');
}
