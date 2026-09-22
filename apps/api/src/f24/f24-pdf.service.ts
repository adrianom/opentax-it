import { Injectable, Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { StorageService } from '../storage/storage.service.js';

/**
 * Prints an F24 by writing the values onto the official form: the AdE "Modello di
 * versamento unificato - F24 Ordinario" (MOD. F24 – 2013 EURO, three copies), published at
 * https://www.agenziaentrate.gov.it/portale/schede/pagamenti/f24/modello-e-istruzioni-f24.
 * The PDF is not redistributed with the source code: it is downloaded from the AdE site on
 * first use (F24_MODEL_URL) and cached in the storage directory; its SHA-256 is compared
 * with the one this layout was calibrated on, so that a new edition of the model is
 * noticed (F24_MODEL_SHA256).
 *
 * Field positions (PDF points, origin bottom-left) were measured on that file with
 * `pdftotext -bbox` (the printed commas of the amount columns give the row grid: rows
 * are 12 pt apart, six rows in the Treasury section, four in the INPS section).
 * Amounts are written with the integer part right-aligned before the printed comma and
 * two decimals after it, as required by the form ("Gli importi devono sempre essere
 * indicati con le prime due cifre decimali", AdE "Avvertenze per la compilazione").
 *
 * Personal data not held in the profile (date and place of birth, sex) are left blank.
 */

export const F24_MODEL_URL =
  process.env.F24_MODEL_URL ??
  'https://www.agenziaentrate.gov.it/portale/documents/20143/250689/Modello+di+versamento+unificato+-+F24+Ordinario_i+Modello+F24+%282%29.pdf/b773b043-a490-82de-550a-eda75246efa0?t=1372409604419';
/** SHA-256 of the model this layout was calibrated on (downloaded 2026-09-22). */
export const F24_MODEL_SHA256 = 'a5429ca42c7330fdd514a4143734342b1e29dbe66edb27185e3be36a6d51712a';
const MODEL_PATH = 'models/f24-ordinario.pdf';

const PAGE_HEIGHT = 841.89;
/** y from the top of the page → PDF y. */
const y = (top: number) => PAGE_HEIGHT - top;

const LAYOUT = {
  fontSize: 8,
  contributor: {
    fiscalCode: { x0: 113.8, x1: 343, baseline: y(118.5), boxes: 16 },
    name: { x: 116, baseline: y(140.5) },
    firstName: { x: 418, baseline: y(140.5) },
    city: { x: 116, baseline: y(189.5) },
    province: { x: 332, baseline: y(189.5) },
    address: { x: 368, baseline: y(189.5) },
  },
  treasury: {
    rows: 6,
    firstBaseline: y(250.6),
    rowStep: 12,
    totalBaseline: y(322.6),
    code: { x: 159 },
    installment: { x: 223 },
    year: { x: 275 },
  },
  inps: {
    rows: 4,
    firstBaseline: y(359),
    rowStep: 12,
    totalBaseline: y(407),
    office: { x: 23 },
    reason: { x: 58 },
    periodFrom: { month: 228, year: 250 },
    periodTo: { month: 280, year: 300 },
  },
  amounts: {
    debit: { intRight: 383, decLeft: 388.5 },
    credit: { intRight: 469.4, decLeft: 474.9 },
    balance: { intRight: 555.8, decLeft: 561.3, signX: 489 },
  },
  finalBalance: { baseline: y(718.6), intRight: 555.8, decLeft: 561.3 },
  /** "Estremi del versamento" date boxes (DD MM YYYY); filled with the planned payment date as intermediaries' software does. */
  paymentDate: { baseline: y(788), day: [36, 50], month: [65, 79], year: [95, 109, 123, 137] },
};

export interface F24PrintLine {
  section: 'TREASURY' | 'INPS';
  code: string;
  officeCode?: string | null;
  installmentCode?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  referenceYear: number;
  debitAmount: number;
  creditAmount: number;
}

export interface F24PrintData {
  /** Planned payment date, ISO. */
  paymentDate?: string;
  fiscalCode: string;
  /** Surname or business name. */
  name: string;
  firstName?: string | null;
  city: string;
  province: string;
  address: string;
  lines: F24PrintLine[];
}

@Injectable()
export class F24PdfService {
  private readonly logger = new Logger(F24PdfService.name);

  constructor(private readonly storage: StorageService) {}

  /** The official model, downloaded once and cached in the storage directory. */
  private async model(): Promise<Buffer> {
    try {
      return await this.storage.read(MODEL_PATH);
    } catch {
      // not cached yet
    }
    let bytes: Buffer;
    try {
      const res = await fetch(F24_MODEL_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      bytes = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      throw new ServiceUnavailableException(`Cannot download the official F24 model from the AdE site (${(e as Error).message}); put it at storage/${MODEL_PATH}`);
    }
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== F24_MODEL_SHA256) this.logger.warn(`F24 model SHA-256 ${sha} differs from the calibrated ${F24_MODEL_SHA256}: check the layout`);
    await this.storage.write(MODEL_PATH, bytes);
    return bytes;
  }

  async render(data: F24PrintData): Promise<Uint8Array> {
    const treasury = data.lines.filter((l) => l.section === 'TREASURY');
    const inps = data.lines.filter((l) => l.section === 'INPS');
    if (treasury.length > LAYOUT.treasury.rows) throw new UnprocessableEntityException(`The form has ${LAYOUT.treasury.rows} Treasury rows, ${treasury.length} needed`);
    if (inps.length > LAYOUT.inps.rows) throw new UnprocessableEntityException(`The form has ${LAYOUT.inps.rows} INPS rows, ${inps.length} needed`);

    const doc = await PDFDocument.load(await this.model());
    const font = await doc.embedFont(StandardFonts.Courier);
    for (const page of doc.getPages()) this.fillPage(page, font, data, treasury, inps);
    return doc.save();
  }

  private fillPage(page: PDFPage, font: PDFFont, data: F24PrintData, treasury: F24PrintLine[], inps: F24PrintLine[]) {
    const size = LAYOUT.fontSize;
    const text = (s: string, x: number, baseline: number) => page.drawText(s, { x, y: baseline, size, font, color: rgb(0, 0, 0) });
    const rightAligned = (s: string, xRight: number, baseline: number) => text(s, xRight - font.widthOfTextAtSize(s, size), baseline);
    const amount = (value: number, col: { intRight: number; decLeft: number }, baseline: number) => {
      if (!(value > 0)) return;
      const [int, dec] = value.toFixed(2).split('.');
      rightAligned(int, col.intRight, baseline);
      text(dec, col.decLeft, baseline);
    };

    // Contributor
    const c = LAYOUT.contributor;
    const boxWidth = (c.fiscalCode.x1 - c.fiscalCode.x0) / c.fiscalCode.boxes;
    [...data.fiscalCode.toUpperCase()].slice(0, c.fiscalCode.boxes).forEach((ch, i) => {
      const w = font.widthOfTextAtSize(ch, size);
      text(ch, c.fiscalCode.x0 + boxWidth * i + (boxWidth - w) / 2, c.fiscalCode.baseline);
    });
    text(data.name.toUpperCase(), c.name.x, c.name.baseline);
    if (data.firstName) text(data.firstName.toUpperCase(), c.firstName.x, c.firstName.baseline);
    text(data.city.toUpperCase(), c.city.x, c.city.baseline);
    text(data.province.toUpperCase(), c.province.x, c.province.baseline);
    text(data.address.toUpperCase(), c.address.x, c.address.baseline);

    // Treasury section
    const t = LAYOUT.treasury;
    let debitA = 0;
    let creditB = 0;
    treasury.forEach((l, i) => {
      const b = t.firstBaseline - i * t.rowStep;
      text(l.code, t.code.x, b);
      if (l.installmentCode) text(l.installmentCode, t.installment.x, b);
      text(String(l.referenceYear), t.year.x, b);
      amount(l.debitAmount, LAYOUT.amounts.debit, b);
      amount(l.creditAmount, LAYOUT.amounts.credit, b);
      debitA += l.debitAmount;
      creditB += l.creditAmount;
    });
    if (treasury.length > 0) this.totals(page, font, debitA, creditB, t.totalBaseline, amount, text);

    // INPS section
    const n = LAYOUT.inps;
    let debitC = 0;
    let creditD = 0;
    inps.forEach((l, i) => {
      const b = n.firstBaseline - i * n.rowStep;
      if (l.officeCode) text(l.officeCode, n.office.x, b);
      text(l.code, n.reason.x, b);
      const from = splitPeriod(l.periodFrom);
      const to = splitPeriod(l.periodTo);
      if (from) {
        text(from.month, n.periodFrom.month, b);
        text(from.year, n.periodFrom.year, b);
      }
      if (to) {
        text(to.month, n.periodTo.month, b);
        text(to.year, n.periodTo.year, b);
      }
      amount(l.debitAmount, LAYOUT.amounts.debit, b);
      amount(l.creditAmount, LAYOUT.amounts.credit, b);
      debitC += l.debitAmount;
      creditD += l.creditAmount;
    });
    if (inps.length > 0) this.totals(page, font, debitC, creditD, n.totalBaseline, amount, text);

    // Payment date
    const d = data.paymentDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (d) {
      const centered = (ch: string, cx: number, b: number) => text(ch, cx - font.widthOfTextAtSize(ch, size) / 2, b);
      const pd = LAYOUT.paymentDate;
      [...d[3]].forEach((ch, i) => centered(ch, pd.day[i], pd.baseline));
      [...d[2]].forEach((ch, i) => centered(ch, pd.month[i], pd.baseline));
      [...d[1]].forEach((ch, i) => centered(ch, pd.year[i], pd.baseline));
    }

    // Final balance (EURO)
    const final = round2(debitA - creditB + (debitC - creditD));
    const f = LAYOUT.finalBalance;
    const [int, dec] = Math.abs(final).toFixed(2).split('.');
    rightAligned(int, f.intRight, f.baseline);
    text(dec, f.decLeft, f.baseline);
  }

  private totals(
    page: PDFPage,
    font: PDFFont,
    debit: number,
    credit: number,
    baseline: number,
    amount: (v: number, col: { intRight: number; decLeft: number }, b: number) => void,
    text: (s: string, x: number, b: number) => void,
  ) {
    amount(round2(debit), LAYOUT.amounts.debit, baseline);
    amount(round2(credit), LAYOUT.amounts.credit, baseline);
    const balance = round2(debit - credit);
    text(balance < 0 ? '-' : '+', LAYOUT.amounts.balance.signX, baseline);
    const [int, dec] = Math.abs(balance).toFixed(2).split('.');
    page.drawText(int, { x: LAYOUT.amounts.balance.intRight - font.widthOfTextAtSize(int, LAYOUT.fontSize), y: baseline, size: LAYOUT.fontSize, font });
    text(dec, LAYOUT.amounts.balance.decLeft, baseline);
  }
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** "01/2025" → { month: "01", year: "2025" }. */
function splitPeriod(p?: string | null): { month: string; year: string } | null {
  const m = p?.match(/^(\d{2})\/(\d{4})$/);
  return m ? { month: m[1], year: m[2] } : null;
}
