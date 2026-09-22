import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { InvoicesPdfService } from './invoices-pdf.service.js';
import type { InvoicePdfData } from './invoices-pdf.service.js';

describe('InvoicesPdfService', () => {
  const service = new InvoicesPdfService();

  const mockData: InvoicePdfData = {
    invoice: {
      id: 'cmucdvj7a000ao6c4bou7qexj',
      tenantId: 'tenant1',
      customerId: 'cust1',
      type: 'TD01',
      year: 2026,
      sequence: 1,
      number: '1/2026',
      date: new Date('2026-09-22T00:00:00Z'),
      currency: 'EUR',
      exchangeRate: 1 as unknown as any,
      vatNature: 'N2_2',
      taxableAmount: 1000 as unknown as any,
      inpsSurcharge: 40 as unknown as any,
      virtualStamp: true,
      stampAmount: 2 as unknown as any,
      total: 1042 as unknown as any,
      notes: [
        "Operazione effettuata in regime forfettario ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni",
        "Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, Legge n. 190 del 2014 e successive modificazioni",
      ],
      status: 'ISSUED',
      refInvoiceId: null,
      paymentTermsId: 'terms1',
      bankAccountId: 'bank1',
      xmlFileName: 'IT01234567890_00001.xml',
      xmlPath: 'invoices/2026/IT01234567890_00001.xml',
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lines: [
        {
          id: 'line1',
          invoiceId: 'inv1',
          lineNumber: 1,
          description: 'Consulenza sviluppo software e architettura cloud',
          quantity: 20 as unknown as any,
          unit: 'ore',
          unitPrice: 50 as unknown as any,
          totalPrice: 1000 as unknown as any,
        },
      ],
      customer: {
        id: 'cust1',
        tenantId: 'tenant1',
        kind: 'IT_B2B',
        businessName: 'Acme Solutions S.r.l.',
        firstName: null,
        lastName: null,
        vatNumber: '09876543210',
        fiscalCode: '09876543210',
        address: 'Via Montenapoleone 1',
        postalCode: '20121',
        city: 'Milano',
        province: 'MI',
        country: 'IT',
        countryCode: 'IT',
        recipientCode: 'M5UXCR1',
        recipientPec: 'acme@pec.it',
        currency: 'EUR',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    profile: {
      id: 'prof1',
      tenantId: 'tenant1',
      businessName: null,
      firstName: 'Mario',
      lastName: 'Rossi',
      fiscalCode: 'RSSMRA80A01H501U',
      vatNumber: '01234567890',
      atecoCode: '62.02.00',
      address: 'Via Roma 10',
      postalCode: '00100',
      city: 'Roma',
      province: 'RM',
      country: 'IT',
      activityStartYear: 2020,
      reducedRate: false,
      isaSubject: false,
      birthDate: '1980-01-01',
      sex: 'M',
      birthPlace: 'Roma',
      birthProvince: 'RM',
      applyInpsSurcharge: true,
      viesRegistered: false,
      pecAddress: 'mario.rossi@pec.it',
      inpsOfficeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    payment: {
      dueDate: '2026-10-22',
      method: 'MP05',
      iban: 'IT60X0542811101000000123456',
      bic: 'UNCRITM1XXX',
    },
  };

  it('generates a valid PDF document with header, customer, lines, totals, and notes', async () => {
    const pdfBytes = await service.generate(mockData);

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify it starts with %PDF-
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('utf8');
    expect(header).toBe('%PDF-');

    // Parse with pdf-lib to ensure valid structure
    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('handles draft invoices without number', async () => {
    const draftData = {
      ...mockData,
      invoice: {
        ...mockData.invoice,
        number: '',
        status: 'DRAFT' as const,
      },
    };

    const pdfBytes = await service.generate(draftData);
    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
