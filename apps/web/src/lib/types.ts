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
  isaSubject: boolean;
  birthDate: string | null;
  sex: string | null;
  birthPlace: string | null;
  birthProvince: string | null;
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
  paymentTermsId: string | null;
  bankAccountId: string | null;
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
  paymentRulesYear: number;
  warnings: string[];
  collectedRevenue: number;
  thresholds: { collectedRevenue: number; accessThreshold: number; exitThreshold: number; exceedsAccessThreshold: boolean; exceedsExitThreshold: boolean };
  input: {
    atecoCode: string;
    activityStartYear: number;
    reducedRateEligible: boolean;
    isaSubject: boolean;
    contributionsPaid: number;
    taxAdvancesPaid: number;
    inpsAdvancesPaid: number;
    taxCredits: number;
    inpsRatePct: number;
    nextYearInpsRatePct: number;
    /** Entered by hand (payments made outside the tool). */
    manual: { contributionsPaid: number; taxAdvancesPaid: number; inpsAdvancesPaid: number };
    /** From F24 forms marked as paid here. */
    fromF24: { contributionsPaid: number; taxAdvancesPaid: number; inpsAdvancesPaid: number };
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

export interface BankAccount {
  id: string;
  name: string;
  bankName: string | null;
  iban: string;
  bic: string | null;
  isDefault: boolean;
}

export interface PaymentTerms {
  id: string;
  name: string;
  days: number;
  method: string;
  isDefault: boolean;
}

export type PlanStart = 'ORDINARY' | 'EXTENDED' | 'DEFERRED' | 'DEFERRED_EXTENDED';

export interface PlanOptions {
  taxYear: number;
  paymentYear: number;
  rulesYear: number;
  warnings: string[];
  starts: Array<{ start: PlanStart; date: string; surchargePct: number; maxInstallments: number; source?: string }>;
  secondAdvanceDate: string;
}

export type F24Kind = 'BALANCE' | 'FIRST_ADVANCE' | 'SECOND_ADVANCE' | 'INSTALLMENT' | 'COMPENSATION' | 'STAMP_DUTY' | 'TAX_NOTICE' | 'OTHER';
export type F24Status = 'PLANNED' | 'SCHEDULED_I24' | 'PAID' | 'CANCELLED';

export type F24Section = 'TREASURY' | 'INPS' | 'REGIONAL' | 'LOCAL';

export interface F24Line {
  id?: string;
  section: F24Section;
  role?: 'BALANCE' | 'FIRST_ADVANCE' | 'SECOND_ADVANCE' | 'INTEREST' | 'CREDIT' | 'OTHER';
  code: string;
  officeCode?: string | null;
  installmentCode?: string | null;
  localCode?: string | null;
  periodFrom?: string | null;
  periodTo?: string | null;
  referenceYear: number;
  debitAmount: string | number;
  creditAmount?: string | number;
  description?: string | null;
}

export interface F24Draft {
  kind: F24Kind;
  paymentDate: string;
  nominalPaymentDate?: string;
  installmentNumber?: number | null;
  installmentsTotal?: number | null;
  totalDebit: string | number;
  totalCredit?: string | number;
  i24CancelBy?: string | null;
  lines: F24Line[];
}

export interface F24 extends F24Draft {
  id: string;
  status: F24Status;
  paidOn?: string | null;
  i24ScheduledAt?: string | null;
  planId?: string | null;
  plan?: { taxYear: number; installments: number } | null;
}

export interface PlanPreview {
  taxYear: number;
  paymentYear: number;
  rulesYear: number;
  start: PlanStart;
  firstDueDate: string;
  surchargePct: number;
  installments: number;
  maxInstallments: number;
  due: PlanAmounts;
  amounts: PlanAmounts;
  credits: { tax: number; inps: number };
  compensation: { used: number; unused: number; order: 'INPS_FIRST' | 'TAX_FIRST'; usages: Array<{ creditId: string; amount: number }> };
  inpsOfficeCode: string;
  forms: F24Draft[];
  warnings: string[];
}

export interface PlanAmounts {
  taxBalance: number;
  taxFirstAdvance: number;
  taxSecondAdvance: number;
  inpsBalance: number;
  inpsFirstAdvance: number;
  inpsSecondAdvance: number;
}

export interface TaxCredit {
  id: string;
  section: F24Section;
  code: string;
  localCode: string | null;
  installmentCode: string | null;
  referenceYear: number;
  amount: string;
  usableFrom: string | null;
  description: string | null;
  notes: string | null;
  used: number;
  remaining: number;
  usages: Array<{ id: string; amount: string; f24Line: { f24: { id: string; paymentDate: string; status: string } } }>;
}

export interface InstallmentPlan {
  id: string;
  taxYear: number;
  paymentYear: number;
  firstDueDate: string;
  installments: number;
  surchargePct: string;
  taxBalance: string;
  taxFirstAdvance: string;
  taxSecondAdvance: string;
  inpsBalance: string;
  inpsFirstAdvance: string;
  inpsSecondAdvance: string;
  creditsUsed: string;
  ruleSetVersion?: number | null;
  createdAt: string;
  f24s: F24[];
}
