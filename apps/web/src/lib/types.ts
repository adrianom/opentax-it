// Shared API types (client-safe).

export interface Deadline {
  kind: string;
  nominalDate: string;
  date: string;
  description: string;
  details: { taxYear: number; percentage?: number; quarter?: number; splittable?: boolean; amount?: number; deferredFrom?: string };
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

export interface TenantProfile {
  businessName: string | null;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  vatNumber: string;
  atecoCode: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  activityStartYear: number;
  reducedRate: boolean;
  applyInpsSurcharge: boolean;
  viesRegistered: boolean;
  pecAddress: string | null;
  inpsOfficeId: string | null;
}

export interface TenantWithProfile extends Tenant {
  profile: TenantProfile;
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


export interface Payment {
  id: string;
  invoiceId: string;
  date: string;
  amount: string;
  amountEur: string;
  exchangeRate: string;
  method: string | null;
  notes: string | null;
}

export interface AdvanceSchedule {
  total: number;
  first: number;
  second: number;
  mode: 'NOT_DUE' | 'SINGLE' | 'TWO_INSTALMENTS';
}

export interface TaxSummary {
  year: number;
  rulesYear: number;
  collectedRevenue: number;
  thresholds: { collectedRevenue: number; accessThreshold: number; exitThreshold: number; exceedsAccessThreshold: boolean; exceedsExitThreshold: boolean };
  input: {
    atecoCode: string;
    activityStartYear: number;
    reducedRateEligible: boolean;
    contributionsPaid: number;
    taxAdvancesPaid: number;
    inpsAdvancesPaid: number;
    taxCredits: number;
    inpsRatePct: number;
  };
  result: {
    coefficientPct: number;
    grossIncome: number;
    contributionsDeducted: number;
    netIncome: number;
    taxRatePct: number;
    substituteTax: number;
    taxNetOfCredits: number;
    inpsTaxableIncome: number;
    inpsContribution: number;
  };
  taxBalance: number;
  inpsBalance: number;
  nextYearAdvances: { tax: AdvanceSchedule; inps: AdvanceSchedule };
}

export interface TaxYearData {
  year: number;
  contributionsPaid: string;
  taxAdvancesPaid: string;
  inpsAdvancesPaid: string;
  taxCredits: string;
  inpsReducedRate: boolean;
}

export interface ImportResult {
  file: string;
  status: 'IMPORTED' | 'SKIPPED' | 'ERROR';
  number?: string;
  invoiceId?: string;
  customer?: string;
  message?: string;
}
