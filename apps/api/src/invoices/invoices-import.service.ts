import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { parseInvoiceXml, type ParsedInvoice, type ParsedParty } from '@opentax-it/fatturapa';
import { isEuMemberState } from '@opentax-it/fiscal-rules';
import type { CustomerKind, DocumentType, VatNature } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

/**
 * Imports invoices issued with other software from their FatturaPA XML files, so that
 * the year's numbering, stamp duty and collections are complete. Imported documents
 * are stored as ISSUED with the original number and the original XML file.
 *
 * Checks: the CedentePrestatore must be the tenant (same VAT number); a document with the
 * same year, type and number is skipped; only TD01/TD04/TD05/TD06 are accepted.
 */

export interface ImportFile {
  name: string;
  xml: string;
}

export interface ImportResult {
  file: string;
  status: 'IMPORTED' | 'SKIPPED' | 'ERROR';
  number?: string;
  invoiceId?: string;
  customer?: string;
  message?: string;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const ACCEPTED: DocumentType[] = ['TD01', 'TD04', 'TD05', 'TD06'];

@Injectable()
export class InvoicesImportService {
  private readonly logger = new Logger(InvoicesImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly storage: StorageService,
  ) {}

  async importFiles(tenantId: string, files: ImportFile[]): Promise<ImportResult[]> {
    const { profile } = await this.tenants.getWithProfile(tenantId);
    const results: ImportResult[] = [];
    for (const f of files) {
      try {
        results.push(await this.importOne(tenantId, profile.vatNumber, f));
      } catch (e) {
        // Only our own validation messages reach the client; anything else (database, file system) is logged.
        if (!(e instanceof HttpException)) this.logger.error(`Import of ${f.name} failed`, e as Error);
        const message = e instanceof HttpException ? e.message : 'Unexpected error while importing this file';
        results.push({ file: f.name, status: 'ERROR', message });
      }
    }
    return results;
  }

  private async importOne(tenantId: string, tenantVat: string, f: ImportFile): Promise<ImportResult> {
    let p: ParsedInvoice;
    try {
      p = parseInvoiceXml(f.xml);
    } catch (e) {
      throw new BadRequestException((e as Error).message); // malformed or unsupported file
    }
    if (p.supplier.vatNumber !== tenantVat) {
      throw new BadRequestException(`CedentePrestatore ${p.supplier.countryCode ?? ''}${p.supplier.vatNumber ?? ''} is not this VAT number (${tenantVat})`);
    }
    if (!ACCEPTED.includes(p.documentType as DocumentType)) throw new BadRequestException(`Document type ${p.documentType} not supported for import`);
    // Numero: String20Type of the FatturaPA XSD (Basic Latin, 1-20 characters).
    if (!/^[\x20-\x7E]{1,20}$/.test(p.number)) throw new BadRequestException(`Invalid document number "${p.number.slice(0, 40)}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new BadRequestException(`Invalid document date "${p.date}"`);
    const year = Number(p.date.slice(0, 4));
    const type = p.documentType as DocumentType;

    const existing = await this.prisma.invoice.findFirst({ where: { tenantId, year, type, number: p.number } });
    if (existing) return { file: f.name, status: 'SKIPPED', number: p.number, invoiceId: existing.id, message: 'Already present' };

    const sequence = parseSequence(p.number);
    if (sequence === undefined) throw new BadRequestException(`Cannot derive a progressive number from "${p.number}"`);
    const clash = await this.prisma.invoice.findFirst({ where: { tenantId, year, type, sequence } });
    if (clash) throw new BadRequestException(`Progressive ${sequence}/${year} already used by document ${clash.number}`);

    // A foreign customer invoiced with N2.2 (made in Italy) is a private customer (art. 7-ter par. 1 lett. b).
    const privateForeign = [...p.summaryNatures, ...p.lines.map((l) => l.nature)].includes('N2.2');
    const customer = await this.findOrCreateCustomer(tenantId, p.customer, p.recipientCode, p.recipientPec, privateForeign);
    const amounts = deriveAmounts(p);
    const refInvoice = p.relatedDocuments[0]
      ? await this.prisma.invoice.findFirst({ where: { tenantId, number: p.relatedDocuments[0].number, type: 'TD01' } })
      : null;

    const xmlFileName = f.name.replace(/[^A-Za-z0-9._-]/g, '_');

    // The stored XML is the archived copy of the document: its path carries the invoice id so that
    // two imports with the same file name never share a file, and it is never overwritten. The
    // file is written inside the transaction, so a failed write leaves no invoice without its XML.
    const inv = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          tenantId,
          customerId: customer.id,
          type,
          year,
          sequence,
          number: p.number,
          date: new Date(`${p.date}T00:00:00Z`),
          currency: p.currency,
          exchangeRate: 1,
          vatNature: amounts.vatNature,
          taxableAmount: amounts.taxableAmount,
          inpsSurcharge: amounts.inpsSurcharge,
          virtualStamp: amounts.virtualStamp,
          stampAmount: amounts.stampAmount,
          total: amounts.total,
          notes: p.notes,
          status: 'ISSUED',
          refInvoiceId: refInvoice?.id ?? null,
          xmlFileName,
          internalNotes: `Imported from ${f.name}`,
          lines: {
            create: p.lines.map((l) => ({
              lineNumber: l.lineNumber,
              description: l.description,
              quantity: l.quantity ?? 1,
              unit: l.unit ?? null,
              unitPrice: l.unitPrice,
              totalPrice: l.totalPrice,
            })),
          },
        },
      });
      const xmlPath = await this.storage.write(`${tenantId}/invoices/${year}/imported/${created.id}_${xmlFileName}`, f.xml, { exclusive: true });
      return tx.invoice.update({ where: { id: created.id }, data: { xmlPath } });
    });
    return { file: f.name, status: 'IMPORTED', number: p.number, invoiceId: inv.id, customer: customer.businessName ?? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() };
  }

  private async findOrCreateCustomer(tenantId: string, c: ParsedParty, recipientCode?: string, recipientPec?: string, privateForeign = false) {
    const countryCode = c.countryCode ?? (c.country ?? 'IT');
    const foreign = countryCode !== 'IT';
    const found = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        OR: [
          ...(c.vatNumber ? [{ countryCode, vatNumber: c.vatNumber }] : []),
          ...(c.fiscalCode ? [{ fiscalCode: c.fiscalCode }] : []),
        ],
      },
    });
    if (found) return found;
    const kind: CustomerKind = foreign
      ? isEuMemberState(countryCode) ? (privateForeign ? 'EU_B2C' : 'EU') : privateForeign ? 'NON_EU_B2C' : 'NON_EU'
      : recipientCode && /^[A-Z0-9]{6}$/.test(recipientCode) ? 'IT_PA' : c.vatNumber ? 'IT_B2B' : 'IT_B2C';
    return this.prisma.customer.create({
      data: {
        tenantId,
        kind,
        businessName: c.businessName ?? null,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        vatNumber: c.vatNumber ?? null,
        fiscalCode: c.fiscalCode ?? null,
        countryCode,
        address: c.address ?? '',
        postalCode: c.postalCode ?? (foreign ? '00000' : null),
        city: c.city ?? '',
        province: foreign ? null : (c.province ?? null),
        country: c.country ?? countryCode,
        recipientCode: recipientCode ?? (foreign ? 'XXXXXXX' : '0000000'),
        recipientPec: recipientPec ?? null,
        notes: 'Created by XML import',
      },
    });
  }
}

/** "12/2026", "12", "FPA 12", "2026-12" → 12. Undefined when no digits are found. */
export function parseSequence(number: string): number | undefined {
  const m = number.match(/(\d+)\s*\/\s*\d{4}$/) ?? number.match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}

function deriveAmounts(p: ParsedInvoice) {
  const virtualStamp = p.stampDuty?.virtual === true;
  const stampAmount = virtualStamp ? round2(p.stampDuty?.amount ?? 2) : 0;
  // Some software exposes the recharged stamp duty as an invoice line (N2.2) besides DatiBollo.
  // Such a line is kept as imported but excluded from taxableAmount, so that taxable + stamp = total
  // as in documents issued here. The recharged stamp is revenue either way (AdE ruling 428/2022);
  // revenue is measured on collections.
  const isStampLine = (l: ParsedInvoice['lines'][number]) => virtualStamp && /bollo/i.test(l.description) && round2(l.totalPrice) === stampAmount;
  const taxableAmount = round2(p.lines.filter((l) => !isStampLine(l)).reduce((s, l) => s + l.totalPrice, 0));
  const inpsSurcharge = round2(p.socialSecurityFund?.amount ?? 0);
  const total = p.documentTotal !== undefined ? round2(p.documentTotal) : round2(taxableAmount + inpsSurcharge + stampAmount);
  const natures = new Set([...p.summaryNatures, ...p.lines.map((l) => l.nature).filter(Boolean)]);
  const vatNature: VatNature = natures.has('N2.1') ? 'N2_1' : 'N2_2';
  return { taxableAmount, inpsSurcharge, virtualStamp, stampAmount, total, vatNature };
}
