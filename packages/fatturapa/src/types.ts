/**
 * Input model for a FatturaPA document issued by a flat-rate ("forfettario") VAT holder.
 * Field names follow the FatturaPA tracciato (technical specifications v1.9.1) where
 * useful, translated to English; comments carry the original element names.
 */

/** FormatoTrasmissione: FPR12 (B2B/B2C), FPA12 (public administration). */
export type TransmissionFormat = 'FPR12' | 'FPA12';

/** TipoDocumento. */
export type DocumentType = 'TD01' | 'TD04' | 'TD05' | 'TD06';

/** Natura (VAT nature) for non-taxable operations. */
export type VatNature = 'N2.1' | 'N2.2';

/** RegimeFiscale. */
export type TaxRegime = 'RF19' | 'RF01';

export interface Party {
  /** IdPaese of the VAT id (IdFiscaleIVA/IdPaese), e.g. "IT", "DE". */
  countryCode: string;
  /** IdFiscaleIVA/IdCodice: VAT number without country prefix. Optional for private individuals. */
  vatNumber?: string;
  /** CodiceFiscale. */
  fiscalCode?: string;
  /** Anagrafica/Denominazione — for companies. */
  businessName?: string;
  /** Anagrafica/Nome. */
  firstName?: string;
  /** Anagrafica/Cognome. */
  lastName?: string;
  address: {
    /** Sede/Indirizzo. */
    street: string;
    /** Sede/NumeroCivico. */
    number?: string;
    /** Sede/CAP: 5 digits; use "00000" for foreign addresses. */
    postalCode: string;
    /** Sede/Comune. */
    city: string;
    /** Sede/Provincia: 2 letters, only for IT. */
    province?: string;
    /** Sede/Nazione: ISO 3166-1 alpha-2. */
    country: string;
  };
}

export interface Supplier extends Party {
  /** RegimeFiscale. */
  taxRegime: TaxRegime;
}

export interface Line {
  /** Descrizione (max 1000 chars). */
  description: string;
  /** Quantita (optional in the tracciato). */
  quantity?: number;
  /** UnitaMisura. */
  unit?: string;
  /** PrezzoUnitario. */
  unitPrice: number;
  /** PrezzoTotale (quantity × unit price, minus discounts). */
  totalPrice: number;
}

export interface SocialSecurityFund {
  /** TipoCassa, e.g. TC22 for INPS. */
  type: string;
  /** AlCassa: percentage. */
  ratePct: number;
  /** ImponibileCassa. */
  taxable: number;
  /** ImportoContributoCassa. */
  amount: number;
}

export interface PaymentDetails {
  /** CondizioniPagamento: TP01 installments, TP02 single payment, TP03 advance. */
  terms: 'TP01' | 'TP02' | 'TP03';
  /** ModalitaPagamento: MP05 bank transfer, MP08 card, ... */
  method: string;
  dueDate?: string;
  amount: number;
  iban?: string;
}

export interface RelatedDocument {
  /** DatiFattureCollegate/IdDocumento. */
  number: string;
  /** DatiFattureCollegate/Data (YYYY-MM-DD). */
  date?: string;
}

export interface FlatRateInvoice {
  format: TransmissionFormat;
  /** ProgressivoInvio: unique per transmitter, max 10 alphanumeric chars. */
  transmissionId: string;
  /** CodiceDestinatario: 7 chars ("0000000" with PEC or unknown channel, "XXXXXXX" for foreign customers). */
  recipientCode: string;
  /** PECDestinatario. */
  recipientPec?: string;
  supplier: Supplier;
  customer: Party;
  documentType: DocumentType;
  /** Numero (max 20 chars), e.g. "12/2026". */
  number: string;
  /** Data (YYYY-MM-DD). */
  date: string;
  /** Divisa: ISO 4217. */
  currency: string;
  vatNature: VatNature;
  /** RiferimentoNormativo in DatiRiepilogo (max 100 chars). */
  legalReference: string;
  /** Causale entries (max 200 chars each). */
  notes: string[];
  lines: Line[];
  /** DatiCassaPrevidenziale (e.g. optional 4% INPS surcharge). */
  socialSecurityFund?: SocialSecurityFund;
  /** DatiBollo: set when stamp duty applies; amount is optional in the tracciato. */
  stampDuty?: { amount?: number };
  payment?: PaymentDetails;
  /** For TD04/TD05: the corrected invoice(s). */
  relatedDocuments?: RelatedDocument[];
}
