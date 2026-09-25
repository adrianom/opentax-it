export interface ImportPreviewRow {
  file: string;
  /** NEW: will be imported; DUPLICATE: already present; ERROR: cannot be imported; IGNORED: not an invoice. */
  status: 'NEW' | 'DUPLICATE' | 'ERROR' | 'IGNORED';
  documentType?: string;
  number?: string;
  date?: string;
  customer?: string;
  total?: number;
  invoiceId?: string;
  message?: string;
}
