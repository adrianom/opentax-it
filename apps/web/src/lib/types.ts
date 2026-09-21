// Shared API types (client-safe).

export interface Deadline {
  kind: string;
  nominalDate: string;
  date: string;
  description: string;
  details: { taxYear: number; percentage?: number; quarter?: number; splittable?: boolean };
  code?: string;
  source?: string;
}

export interface RuleSetSummary {
  id: string;
  year: number;
  version: number;
  status: 'DRAFT' | 'PROPOSED' | 'ACTIVE' | 'SUPERSEDED';
  activatedAt: string | null;
  notes: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
}

export type CustomerKind = 'IT_B2B' | 'IT_B2C' | 'IT_PA' | 'EU' | 'NON_EU';

export interface Customer {
  id: string;
  kind: CustomerKind;
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
  vatNumber: string | null;
  fiscalCode: string | null;
  countryCode: string;
  address: string;
  postalCode: string | null;
  city: string;
  province: string | null;
  country: string;
  recipientCode: string;
  recipientPec: string | null;
  currency: string;
  notes: string | null;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'DELIVERED' | 'NOT_DELIVERED' | 'REJECTED' | 'CANCELLED';

export interface InvoiceLine {
  lineNumber: number;
  description: string;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  totalPrice: string;
}

export interface Invoice {
  id: string;
  type: 'TD01' | 'TD04' | 'TD05' | 'TD06';
  year: number;
  number: string;
  date: string;
  currency: string;
  vatNature: 'N2_1' | 'N2_2';
  taxableAmount: string;
  inpsSurcharge: string;
  virtualStamp: boolean;
  stampAmount: string;
  total: string;
  notes: string[];
  status: InvoiceStatus;
  refInvoiceId: string | null;
  xmlFileName: string | null;
  customer: Pick<Customer, 'id' | 'businessName' | 'firstName' | 'lastName' | 'kind'>;
  lines?: InvoiceLine[];
}

