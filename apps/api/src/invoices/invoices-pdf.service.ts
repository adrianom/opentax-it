import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { Invoice, InvoiceLine, Customer, TenantProfile } from '../generated/prisma/client.js';
import type { CreateInvoiceDto } from './invoices.dto.js';

export interface InvoicePdfData {
  invoice: Invoice & { lines: InvoiceLine[]; customer: Customer };
  profile: TenantProfile;
  payment?: CreateInvoiceDto['payment'];
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 555.28;
const CONTENT_WIDTH = MARGIN_RIGHT - MARGIN_LEFT;

const TYPE_NAMES: Record<string, string> = {
  TD01: 'FATTURA',
  TD04: 'NOTA DI CREDITO',
  TD05: 'NOTA DI DEBITO',
  TD06: 'PARCELLA',
};

function formatCurrency(n: unknown, currency = 'EUR'): string {
  const num = typeof n === 'number' ? n : Number(String(n));
  const formatted = num.toFixed(2).replace('.', ',');
  // Add thousands separator
  const [intPart, decPart] = formatted.split(',');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withThousands},${decPart} ${currency}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10).split('-').reverse().join('/');
}

/** Sanitize text to fit standard PDF Helvetica (WinAnsi encoding). */
function cleanPdfText(text: string): string {
  return text
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2018|\u2019|\u201A/g, "'")
    .replace(/\u201C|\u201D|\u201E/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\u20AC/g, 'EUR')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = cleanPdfText(text).split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
}

@Injectable()
export class InvoicesPdfService {
  async generate(data: InvoicePdfData): Promise<Uint8Array> {
    const { invoice: inv, profile, payment } = data;
    const doc = await PDFDocument.create();

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

    const pages: PDFPage[] = [];
    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);

    let y = PAGE_HEIGHT - 40;

    const newPage = () => {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pages.push(page);
      y = PAGE_HEIGHT - 40;
      // Header on continuation pages
      page.drawText(cleanPdfText(`${TYPE_NAMES[inv.type] ?? 'FATTURA'} N. ${inv.number || '(BOZZA)'} (continua)`), {
        x: MARGIN_LEFT,
        y,
        size: 9,
        font: fontItalic,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 25;
    };

    // --- 1. HEADER & SUPPLIER INFO ---
    const isDraft = inv.status === 'DRAFT' || !inv.number;
    const docTitle = isDraft ? 'BOZZA PROFORMA' : (TYPE_NAMES[inv.type] ?? 'FATTURA');

    // Right: Document title & meta box
    page.drawText(docTitle, {
      x: 350,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });

    const docNumber = inv.number ? `N. ${inv.number}` : 'Bozza';
    page.drawText(`Numero: ${docNumber}`, { x: 350, y: y - 18, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Data: ${formatDate(inv.date)}`, { x: 350, y: y - 32, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Valuta: ${inv.currency}`, { x: 350, y: y - 46, size: 9, font, color: rgb(0.2, 0.2, 0.2) });

    // Left: Supplier Info
    const supplierName = profile.businessName || `${profile.firstName} ${profile.lastName}`.trim();
    page.drawText(cleanPdfText(supplierName), { x: MARGIN_LEFT, y, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    let sy = y - 16;
    page.drawText('Regime Fiscale: RF19 - Regime forfettario', { x: MARGIN_LEFT, y: sy, size: 8.5, font: fontItalic, color: rgb(0.3, 0.3, 0.3) });
    sy -= 12;
    page.drawText(`P.IVA: ${profile.vatNumber || '-'}   C.F.: ${profile.fiscalCode || '-'}`, { x: MARGIN_LEFT, y: sy, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
    sy -= 12;
    page.drawText(cleanPdfText(`${profile.address}, ${profile.postalCode} ${profile.city} (${profile.province}) - ${profile.country}`), {
      x: MARGIN_LEFT,
      y: sy,
      size: 8.5,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    if (profile.pecAddress) {
      sy -= 12;
      page.drawText(`PEC: ${profile.pecAddress}`, { x: MARGIN_LEFT, y: sy, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
    }

    y = Math.min(sy, y - 65) - 20;

    // Divider line
    page.drawLine({ start: { x: MARGIN_LEFT, y }, end: { x: MARGIN_RIGHT, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 15;

    // --- 2. CUSTOMER BOX ---
    const customerBoxY = y;
    const c = inv.customer;
    const customerName = c.businessName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();

    // Box background
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: customerBoxY - 60,
      width: CONTENT_WIDTH,
      height: 60,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.85, 0.87, 0.9),
      borderWidth: 0.5,
    });

    page.drawText('DESTINATARIO / CLIENTE', { x: MARGIN_LEFT + 10, y: customerBoxY - 14, size: 8, font: fontBold, color: rgb(0.3, 0.4, 0.5) });
    page.drawText(cleanPdfText(customerName), { x: MARGIN_LEFT + 10, y: customerBoxY - 28, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    const custAddress = `${c.address}, ${c.postalCode ?? ''} ${c.city} (${c.province ?? c.country})`;
    page.drawText(cleanPdfText(custAddress), { x: MARGIN_LEFT + 10, y: customerBoxY - 41, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });

    const idText = `P.IVA: ${c.vatNumber || '-'}   C.F.: ${c.fiscalCode || '-'}   Cod. SDI: ${c.recipientCode}${c.recipientPec ? `   PEC: ${c.recipientPec}` : ''}`;
    page.drawText(cleanPdfText(idText), { x: MARGIN_LEFT + 10, y: customerBoxY - 53, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });

    y = customerBoxY - 75;

    // --- 3. ITEMS TABLE ---
    const tableHeaderY = y;
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: tableHeaderY - 16,
      width: CONTENT_WIDTH,
      height: 18,
      color: rgb(0.92, 0.94, 0.96),
    });

    const colX = {
      num: MARGIN_LEFT + 6,
      desc: MARGIN_LEFT + 30,
      qty: 320,
      unitPrice: 390,
      vat: 460,
      total: MARGIN_RIGHT - 6,
    };

    page.drawText('#', { x: colX.num, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Descrizione', { x: colX.desc, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Q.ta', { x: colX.qty - 20, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Prezzo Unit.', { x: colX.unitPrice - 40, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('IVA / Natura', { x: colX.vat - 35, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Totale', { x: colX.total - 30, y: tableHeaderY - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    y = tableHeaderY - 24;

    const vatLabel = inv.vatNature === 'N2_1' ? '0% N2.1' : '0% N2.2';

    for (const line of inv.lines) {
      const descLines = wrapText(line.description, 260, font, 8.5);
      const rowHeight = Math.max(16, descLines.length * 11 + 6);

      if (y - rowHeight < 160) newPage();

      // Line number
      page.drawText(String(line.lineNumber), { x: colX.num, y: y - 10, size: 8.5, font, color: rgb(0.3, 0.3, 0.3) });

      // Description lines
      descLines.forEach((dl, i) => {
        page.drawText(dl, { x: colX.desc, y: y - 10 - i * 11, size: 8.5, font, color: rgb(0.15, 0.15, 0.15) });
      });

      // Quantity
      const qtyStr = `${Number(line.quantity)} ${line.unit ?? ''}`.trim();
      const qtyW = font.widthOfTextAtSize(qtyStr, 8.5);
      page.drawText(cleanPdfText(qtyStr), { x: colX.qty - qtyW, y: y - 10, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });

      // Unit Price
      const upStr = formatCurrency(line.unitPrice, inv.currency);
      const upW = font.widthOfTextAtSize(upStr, 8.5);
      page.drawText(cleanPdfText(upStr), { x: colX.unitPrice - upW, y: y - 10, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });

      // VAT Nature
      const vatW = font.widthOfTextAtSize(vatLabel, 8.5);
      page.drawText(vatLabel, { x: colX.vat - vatW, y: y - 10, size: 8.5, font, color: rgb(0.3, 0.3, 0.3) });

      // Total Price
      const tpStr = formatCurrency(line.totalPrice, inv.currency);
      const tpW = fontBold.widthOfTextAtSize(tpStr, 8.5);
      page.drawText(cleanPdfText(tpStr), { x: colX.total - tpW, y: y - 10, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

      y -= rowHeight;
      page.drawLine({ start: { x: MARGIN_LEFT, y: y + 2 }, end: { x: MARGIN_RIGHT, y: y + 2 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
    }

    y -= 10;

    // --- 4. TOTALS SUMMARY & PAYMENT ---
    if (y < 210) newPage();

    const summaryY = y;
    const totalsLeft = 340;
    const totalsRight = MARGIN_RIGHT - 6;

    const drawTotalLine = (label: string, val: string, isBold = false) => {
      const f = isBold ? fontBold : font;
      const s = isBold ? 9.5 : 8.5;
      page.drawText(label, { x: totalsLeft, y: y - 8, size: s, font: f, color: rgb(0.2, 0.2, 0.2) });
      const valW = f.widthOfTextAtSize(val, s);
      page.drawText(val, { x: totalsRight - valW, y: y - 8, size: s, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
    };

    drawTotalLine('Imponibile:', formatCurrency(inv.taxableAmount, inv.currency));

    if (Number(inv.inpsSurcharge) > 0) {
      drawTotalLine('Rivalsa INPS 4%:', formatCurrency(inv.inpsSurcharge, inv.currency));
    }

    drawTotalLine('IVA (0%):', `0,00 ${inv.currency}`);

    if (inv.virtualStamp) {
      drawTotalLine('Bollo virtuale:', formatCurrency(inv.stampAmount, inv.currency));
    }

    // Grand total box
    y -= 4;
    page.drawRectangle({
      x: totalsLeft - 5,
      y: y - 14,
      width: MARGIN_RIGHT - totalsLeft + 5,
      height: 20,
      color: rgb(0.93, 0.95, 0.98),
      borderColor: rgb(0.7, 0.8, 0.9),
      borderWidth: 0.5,
    });
    const totLabel = 'TOTALE DOCUMENTO:';
    const totVal = formatCurrency(inv.total, inv.currency);
    page.drawText(totLabel, { x: totalsLeft, y: y - 9, size: 9.5, font: fontBold, color: rgb(0.05, 0.15, 0.35) });
    const totValW = fontBold.widthOfTextAtSize(totVal, 10);
    page.drawText(cleanPdfText(totVal), { x: totalsRight - totValW, y: y - 9, size: 10, font: fontBold, color: rgb(0.05, 0.15, 0.35) });

    // Payment details on the left side of summary
    if (payment) {
      let py = summaryY;
      page.drawText('MODALITA DI PAGAMENTO', { x: MARGIN_LEFT, y: py - 8, size: 8, font: fontBold, color: rgb(0.3, 0.4, 0.5) });
      py -= 14;
      if (payment.method) {
        page.drawText(`Metodo: ${payment.method === 'MP05' ? 'Bonifico bancario (MP05)' : payment.method}`, {
          x: MARGIN_LEFT,
          y: py - 8,
          size: 8.5,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        py -= 12;
      }
      if (payment.dueDate) {
        page.drawText(`Scadenza: ${formatDate(payment.dueDate)}`, { x: MARGIN_LEFT, y: py - 8, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
        py -= 12;
      }
      if (payment.iban) {
        page.drawText(`IBAN: ${payment.iban}`, { x: MARGIN_LEFT, y: py - 8, size: 8.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        py -= 12;
      }
      if (payment.bic) {
        page.drawText(`BIC: ${payment.bic}`, { x: MARGIN_LEFT, y: py - 8, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
        py -= 12;
      }
    }

    y -= 30;

    // --- 5. STATUTORY NOTES & NOTES ---
    const allNotes = [...(inv.notes || [])];
    if (inv.virtualStamp && !allNotes.some((n) => n.toLowerCase().includes('bollo'))) {
      allNotes.push('Imposta di bollo assolta in modo virtuale ai sensi del D.M. 17 giugno 2014.');
    }

    if (allNotes.length > 0) {
      if (y < 120) newPage();

      page.drawText('DICITURE NORMATIVE E ANNOTAZIONI', { x: MARGIN_LEFT, y, size: 7.5, font: fontBold, color: rgb(0.3, 0.4, 0.5) });
      y -= 12;

      for (const note of allNotes) {
        const noteLines = wrapText(note, CONTENT_WIDTH - 12, font, 7.5);
        if (y - noteLines.length * 10 < 50) newPage();

        page.drawRectangle({
          x: MARGIN_LEFT,
          y: y - noteLines.length * 10 - 2,
          width: CONTENT_WIDTH,
          height: noteLines.length * 10 + 4,
          color: rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.3,
        });

        noteLines.forEach((nl, i) => {
          page.drawText(nl, { x: MARGIN_LEFT + 6, y: y - 8 - i * 10, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
        });

        y -= noteLines.length * 10 + 6;
      }
    }

    // --- 6. FOOTER ON ALL PAGES ---
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      p.drawLine({ start: { x: MARGIN_LEFT, y: 32 }, end: { x: MARGIN_RIGHT, y: 32 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });

      const disclaimer = 'Copia di cortesia priva di valenza fiscale ai sensi dell\'art. 21 DPR 633/72. L\'originale e il file XML inviato a SDI.';
      p.drawText(disclaimer, {
        x: MARGIN_LEFT,
        y: 22,
        size: 7,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pageNumStr = `Pagina ${idx + 1} di ${totalPages}`;
      const pnWidth = font.widthOfTextAtSize(pageNumStr, 7.5);
      p.drawText(pageNumStr, {
        x: MARGIN_RIGHT - pnWidth,
        y: 22,
        size: 7.5,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    return doc.save();
  }
}
