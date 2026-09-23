import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StorageService } from '../storage/storage.service.js';
import type { TenantsService } from '../tenants/tenants.service.js';
import { InvoicesImportService } from './invoices-import.service.js';

vi.mock('@opentax-it/fatturapa', () => ({
  parseInvoiceXml: (xml: string) => ({
    supplier: { countryCode: 'IT', vatNumber: '01234567890' },
    customer: { countryCode: 'IT', vatNumber: '09876543210', businessName: 'Acme' },
    documentType: 'TD01',
    date: '2025-03-01',
    number: xml, // each test file carries its own number
    currency: 'EUR',
    lines: [{ lineNumber: 1, description: 'Consulenza', unitPrice: 100, totalPrice: 100 }],
    summaryNatures: ['N2.2'],
    relatedDocuments: [],
    notes: [],
  }),
}));

function setup() {
  let n = 0;
  const tx = {
    invoice: {
      create: vi.fn().mockImplementation(() => Promise.resolve({ id: `inv${++n}` })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
  const prisma = {
    invoice: { findFirst: vi.fn().mockResolvedValue(null) },
    customer: { findFirst: vi.fn().mockResolvedValue({ id: 'cust1', businessName: 'Acme' }) },
    $transaction: vi.fn().mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService;
  const storage = { write: vi.fn().mockImplementation((path: string) => Promise.resolve(path)) };
  const tenants = { getWithProfile: vi.fn().mockResolvedValue({ profile: { vatNumber: '01234567890' } }) } as unknown as TenantsService;
  const service = new InvoicesImportService(prisma, tenants, storage as unknown as StorageService);
  return { service, storage, tx };
}

describe('InvoicesImportService.importFiles', () => {
  it('stores two files with the same name at different paths, never overwriting', async () => {
    const { service, storage, tx } = setup();
    const results = await service.importFiles('tenant1', [
      { name: 'fattura.xml', xml: '1/2025' },
      { name: 'fattura.xml', xml: '2/2025' },
    ]);

    expect(results.map((r) => r.status)).toEqual(['IMPORTED', 'IMPORTED']);
    const paths = storage.write.mock.calls.map((c) => c[0]);
    expect(paths).toEqual(['tenant1/invoices/2025/imported/inv1_fattura.xml', 'tenant1/invoices/2025/imported/inv2_fattura.xml']);
    for (const call of storage.write.mock.calls) expect(call[2]).toEqual({ exclusive: true });
    expect(tx.invoice.update).toHaveBeenCalledWith({ where: { id: 'inv1' }, data: { xmlPath: paths[0] } });
  });

  it('reports an error when the XML cannot be stored, inside the transaction', async () => {
    const { service, storage } = setup();
    storage.write.mockRejectedValueOnce(Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' }));
    const [result] = await service.importFiles('tenant1', [{ name: 'fattura.xml', xml: '1/2025' }]);
    expect(result.status).toBe('ERROR');
    expect(result.message).toBe('Unexpected error while importing this file'); // no file system details
  });

  it('rejects a Numero that is not Basic Latin or longer than 20 characters (String20Type)', async () => {
    const { service, storage } = setup();
    const results = await service.importFiles('tenant1', [
      { name: 'a.xml', xml: '1/2025"\r\nX' },
      { name: 'b.xml', xml: '1/2025-ç' },
      { name: 'c.xml', xml: '123456789012345678901' },
    ]);
    expect(results.map((r) => r.status)).toEqual(['ERROR', 'ERROR', 'ERROR']);
    expect(results[0].message).toMatch(/^Invalid document number/);
    expect(storage.write).not.toHaveBeenCalled();
  });
});
