'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError, TENANT_COOKIE } from './api';
import type { ImportResult } from './types';

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
      isaSubject: formData.get('isaSubject') === 'on',
      birthDate: f('birthDate'),
      sex: f('sex').toUpperCase(),
      birthPlace: f('birthPlace'),
      birthProvince: f('birthProvince').toUpperCase(),
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
  paymentTermsId?: string;
  bankAccountId?: string;
  date: string;
  applyInpsSurcharge?: boolean;
  lines: Array<{ description: string; quantity: number; unit?: string; unitPrice: number }>;
}

/** Creates a draft, or updates it when `id` is given (only drafts can be edited). */
export async function saveInvoice(id: string | undefined, input: InvoiceInput): Promise<{ id?: string; error?: string }> {
  try {
    const data = { ...input, refInvoiceId: input.refInvoiceId || undefined, paymentTermsId: input.paymentTermsId || undefined, bankAccountId: input.bankAccountId || undefined };
    const inv = id ? await api.updateInvoice(id, data) : await api.createInvoice(data);
    revalidatePath('/invoices');
    if (id) revalidatePath(`/invoices/${id}`);
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
      isaSubject: formData.get('isaSubject') === 'on',
      birthDate: f('birthDate'),
      sex: f('sex').toUpperCase(),
      birthPlace: f('birthPlace'),
      birthProvince: f('birthProvince').toUpperCase(),
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

export async function addPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const invoiceId = String(formData.get('invoiceId'));
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    await api.createPayment(invoiceId, {
      date: f('date'),
      amount: Number(f('amount').replace(',', '.')),
      method: f('method') || undefined,
      notes: f('notes') || undefined,
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/dashboard');
  revalidatePath('/taxes');
  return undefined;
}

export async function deletePayment(formData: FormData) {
  await api.deletePayment(String(formData.get('id')));
  revalidatePath(`/invoices/${String(formData.get('invoiceId'))}`);
  revalidatePath('/dashboard');
  revalidatePath('/taxes');
}

export async function saveTaxYearData(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const year = Number(formData.get('year'));
  const num = (k: string) => Number(String(formData.get(k) ?? '0').replace(',', '.')) || 0;
  try {
    await api.updateTaxYearData(year, {
      contributionsPaid: num('contributionsPaid'),
      taxAdvancesPaid: num('taxAdvancesPaid'),
      inpsAdvancesPaid: num('inpsAdvancesPaid'),
      taxCredits: num('taxCredits'),
      inpsReducedRate: formData.get('inpsReducedRate') === 'on',
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/taxes');
  revalidatePath('/dashboard');
  return undefined;
}

export async function importInvoiceFiles(files: Array<{ name: string; xml: string }>): Promise<{ results?: ImportResult[]; error?: string }> {
  try {
    const results = await api.importInvoices(files);
    revalidatePath('/invoices');
    revalidatePath('/customers');
    revalidatePath('/dashboard');
    revalidatePath('/deadlines');
    return { results };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function saveBankAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    await api.saveBankAccount(
      { name: f('name'), bankName: f('bankName') || undefined, iban: f('iban').replace(/\s+/g, '').toUpperCase(), bic: f('bic').toUpperCase() || undefined, isDefault: formData.get('isDefault') === 'on' },
      f('id') || undefined,
    );
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/banks');
  return undefined;
}

export async function deleteBankAccount(formData: FormData) {
  await api.deleteBankAccount(String(formData.get('id')));
  revalidatePath('/banks');
}

export async function savePaymentTerms(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    await api.savePaymentTerms({ name: f('name'), days: Number(f('days')), method: f('method') || 'MP05', isDefault: formData.get('isDefault') === 'on' }, f('id') || undefined);
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/payment-terms');
  return undefined;
}

export async function deletePaymentTerms(formData: FormData) {
  await api.deletePaymentTerms(String(formData.get('id')));
  revalidatePath('/payment-terms');
}

export async function createPlan(formData: FormData) {
  const taxYear = Number(formData.get('taxYear'));
  try {
    await api.createPlan(taxYear, {
      start: String(formData.get('start')),
      installments: Number(formData.get('installments')),
      useCredits: formData.get('useCredits') === 'on' || formData.get('useCredits') === 'true',
      creditOrder: String(formData.get('creditOrder') || 'INPS_FIRST'),
    });
  } catch (e) {
    redirect(`/f24?year=${taxYear}&error=${encodeURIComponent(errorMessage(e))}`);
  }
  revalidatePath('/f24');
  revalidatePath('/dashboard');
  redirect(`/f24?year=${taxYear}`);
}

export async function deletePlan(formData: FormData) {
  const taxYear = Number(formData.get('taxYear'));
  try {
    await api.deletePlan(taxYear);
  } catch (e) {
    redirect(`/f24?year=${taxYear}&error=${encodeURIComponent(errorMessage(e))}`);
  }
  revalidatePath('/f24');
  revalidatePath('/dashboard');
  redirect(`/f24?year=${taxYear}`);
}

export async function setF24Status(formData: FormData) {
  const id = String(formData.get('id'));
  const taxYear = Number(formData.get('taxYear'));
  const status = String(formData.get('status'));
  const paidOn = String(formData.get('paidOn') ?? '');
  try {
    await api.updateF24Status(id, { status, paidOn: paidOn || undefined });
  } catch (e) {
    redirect(`/f24?year=${taxYear}&error=${encodeURIComponent(errorMessage(e))}`);
  }
  revalidatePath('/f24');
  revalidatePath('/dashboard');
}

export async function saveTaxCredit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => String(formData.get(k) ?? '').trim();
  try {
    await api.createTaxCredit({
      section: f('section'),
      code: f('code').toUpperCase(),
      referenceYear: Number(f('referenceYear')),
      amount: Number(f('amount').replace(',', '.')),
      localCode: f('localCode').toUpperCase() || undefined,
      installmentCode: f('installmentCode') || undefined,
      usableFrom: f('usableFrom') || undefined,
      description: f('description') || undefined,
    });
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/credits');
  revalidatePath('/f24');
  return undefined;
}

export async function deleteTaxCredit(formData: FormData) {
  const id = String(formData.get('id'));
  try {
    await api.deleteTaxCredit(id);
  } catch (e) {
    redirect(`/credits?error=${encodeURIComponent(errorMessage(e))}`);
  }
  revalidatePath('/credits');
  revalidatePath('/f24');
}
