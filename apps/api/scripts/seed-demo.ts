/**
 * Loads a fictitious tenant ("Demo Forfettario") with customers, invoices issued in the
 * previous and current year, collections and manually entered year data, so that the
 * taxes summary, the deadline calendar and the F24 plan have something to show.
 *
 * Runs against a running API (default http://localhost:3000/api) through the public
 * endpoints, so every document goes through the same validation as the UI. Idempotent:
 * a second run finds the tenant by name and stops. All data is invented; the VAT number
 * and fiscal code are syntactically valid but do not belong to anyone.
 *
 *   node scripts/seed-demo.ts            (from apps/api; Node 24 runs TypeScript directly)
 *   pnpm demo:seed                       (from the repository root)
 */

const API = process.env.API_URL ?? 'http://localhost:3000/api';
const TENANT_NAME = 'Demo Forfettario';
const thisYear = new Date().getFullYear();
const prevYear = thisYear - 1;

let tenantId = '';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(tenantId ? { 'x-tenant-id': tenantId } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${Array.isArray(json?.message) ? json.message.join('; ') : json?.message}`);
  return json as T;
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

async function main() {
  const tenants = await call<Array<{ id: string; name: string }>>('GET', '/tenants');
  const existing = tenants.find((t) => t.name === TENANT_NAME);
  if (existing) {
    console.log(`Tenant "${TENANT_NAME}" already exists (${existing.id}); nothing to do. Select it in /setup.`);
    return;
  }

  const tenant = await call<{ id: string }>('POST', '/tenants', {
    name: TENANT_NAME,
    firstName: 'Demo',
    lastName: 'Forfettario',
    fiscalCode: 'DMOFRF85A01G273K',
    birthDate: '1985-01-01',
    sex: 'M',
    birthPlace: 'Palermo',
    birthProvince: 'PA',
    vatNumber: '01234567890',
    atecoCode: '62.02',
    address: 'Via Roma 1',
    postalCode: '90133',
    city: 'Palermo',
    province: 'PA',
    activityStartYear: 2021,
    reducedRate: false,
    applyInpsSurcharge: true,
    isaSubject: true,
    viesRegistered: true,
    inpsOfficeId: '5500-palermo',
  });
  tenantId = tenant.id;
  console.log(`Created tenant ${tenantId}`);

  await call('POST', '/tenants/me/bank-accounts', { name: 'Conto principale', bankName: 'Banca Demo', iban: 'IT60X0542811101000000123456', isDefault: true });
  await call('POST', '/tenants/me/payment-terms', { name: 'Bonifico 30 gg', days: 30, method: 'MP05', isDefault: true });
  await call('POST', '/tenants/me/payment-terms', { name: 'Bonifico 10 gg', days: 10, method: 'MP05' });

  const acme = await call<{ id: string }>('POST', '/customers', { kind: 'IT_B2B', businessName: 'Acme Software S.r.l.', vatNumber: '09876543210', countryCode: 'IT', address: 'Via Milano 10', postalCode: '20121', city: 'Milano', province: 'MI', country: 'IT', recipientCode: 'ABCDEF1' });
  const rossi = await call<{ id: string }>('POST', '/customers', { kind: 'IT_B2C', firstName: 'Mario', lastName: 'Rossi', fiscalCode: 'RSSMRA80A01H501U', countryCode: 'IT', address: 'Via Garibaldi 5', postalCode: '00185', city: 'Roma', province: 'RM', country: 'IT', recipientCode: '0000000' });
  const gmbh = await call<{ id: string }>('POST', '/customers', { kind: 'EU', businessName: 'Beispiel GmbH', vatNumber: 'DE123456789', countryCode: 'DE', address: 'Hauptstrasse 1', postalCode: '00000', city: 'Berlin', country: 'DE', recipientCode: 'XXXXXXX' });
  console.log('Created 3 customers');

  // Previous year: ten invoices, all collected within the year (cash basis → income of the previous year).
  const prev: Array<[number, string, number, string]> = [
    [1, acme.id, 4200, 'Sviluppo modulo gestionale — gennaio'],
    [2, acme.id, 4200, 'Sviluppo modulo gestionale — febbraio'],
    [3, gmbh.id, 3800, 'Backend API development — March'],
    [4, acme.id, 4600, 'Sviluppo modulo gestionale — aprile'],
    [5, rossi.id, 1500, 'Sito web e configurazione hosting'],
    [6, acme.id, 4600, 'Sviluppo modulo gestionale — giugno'],
    [7, gmbh.id, 5200, 'Backend API development — July'],
    [9, acme.id, 4800, 'Sviluppo modulo gestionale — settembre'],
    [10, acme.id, 4800, 'Sviluppo modulo gestionale — ottobre'],
    [11, gmbh.id, 6100, 'Backend API development — November'],
  ];
  let collectedPrev = 0;
  for (const [month, customerId, amount, description] of prev) {
    const inv = await call<{ id: string }>('POST', '/invoices', { customerId, date: iso(prevYear, month, 28), lines: [{ description, quantity: 1, unitPrice: amount }] });
    const issued = await call<{ id: string; total: string; number: string }>('POST', `/invoices/${inv.id}/issue`, {});
    const payDate = month === 11 ? iso(prevYear, 12, 20) : iso(prevYear, month + 1, 15);
    await call('POST', `/invoices/${inv.id}/payments`, { date: payDate, amount: Number(issued.total), method: 'bank transfer' });
    collectedPrev += Number(issued.total);
    console.log(`Issued ${issued.number} (${issued.total} EUR), collected on ${payDate}`);
  }

  // Current year: invoices up to today, the last one not yet collected.
  const now = new Date();
  const cur: Array<[number, string, number, string]> = [
    [1, acme.id, 5000, 'Sviluppo e manutenzione — gennaio'],
    [2, acme.id, 5000, 'Sviluppo e manutenzione — febbraio'],
    [3, gmbh.id, 6100, 'Backend API development — March'],
    [4, acme.id, 5000, 'Sviluppo e manutenzione — aprile'],
    [5, acme.id, 5000, 'Sviluppo e manutenzione — maggio'],
    [6, rossi.id, 900, 'Assistenza sito web'],
    [7, acme.id, 5200, 'Sviluppo e manutenzione — luglio'],
    [9, acme.id, 5200, 'Sviluppo e manutenzione — settembre'],
  ];
  for (const [month, customerId, amount, description] of cur) {
    if (month > now.getMonth() + 1) break;
    const inv = await call<{ id: string }>('POST', '/invoices', { customerId, date: iso(thisYear, month, Math.min(28, month === now.getMonth() + 1 ? now.getDate() : 28)), lines: [{ description, quantity: 1, unitPrice: amount }] });
    const issued = await call<{ id: string; total: string; number: string }>('POST', `/invoices/${inv.id}/issue`, {});
    const paid = month < now.getMonth() + 1;
    if (paid) await call('POST', `/invoices/${inv.id}/payments`, { date: iso(thisYear, month + 1, 10), amount: Number(issued.total), method: 'bank transfer' });
    console.log(`Issued ${issued.number} (${issued.total} EUR)${paid ? ', collected' : ', open'}`);
  }

  // Amounts paid during the previous year with F24 (entered by hand, as in the taxes page).
  await call('PUT', `/taxes/${prevYear}/data`, { contributionsPaid: 8500, taxAdvancesPaid: 1200, inpsAdvancesPaid: 3900, taxCredits: 0, inpsReducedRate: false });
  await call('PUT', `/taxes/${thisYear}/data`, { contributionsPaid: 0, taxAdvancesPaid: 0, inpsAdvancesPaid: 0, taxCredits: 0, inpsReducedRate: false });

  console.log(`\nDone. Collected in ${prevYear}: ${collectedPrev.toFixed(2)} EUR.`);
  console.log(`Select "${TENANT_NAME}" in /setup, then open /taxes?year=${prevYear} and /f24?year=${prevYear}.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
