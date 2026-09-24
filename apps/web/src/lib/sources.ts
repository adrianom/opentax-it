import { formatDate } from './format';
import type { SourceKind } from './types';

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  law: 'Norma',
  circular: 'Circolare',
  resolution: 'Risoluzione',
  instructions: 'Istruzioni',
  specification: 'Specifiche tecniche',
  guide: 'Guida',
  table: 'Tabella',
  'web-page': 'Pagina web',
};

/** Italian names of the rule set entries (fields or sections) cited in `sourceRefs`. */
export const RULE_LABELS: Record<string, string> = {
  'flatRate.revenueThreshold': 'Soglia di ricavi per il regime forfettario',
  'flatRate.immediateExitThreshold': 'Soglia di uscita immediata dal regime',
  'flatRate.employeeCostThreshold': 'Limite delle spese per lavoro dipendente',
  'flatRate.employmentIncomeThreshold': 'Limite dei redditi da lavoro dipendente',
  'flatRate.standardRatePct': 'Aliquota dell\'imposta sostitutiva',
  'flatRate.reducedRatePct': 'Aliquota ridotta per le nuove attività',
  'flatRate.reducedRateYears': 'Anni di aliquota ridotta',
  'flatRate.profitabilityByAteco': 'Coefficienti di redditività per codice ATECO',
  advancePayment: 'Acconti dell\'imposta sostitutiva',
  'advancePayment.percentage': 'Misura dell\'acconto',
  'advancePayment.notDueBelow': 'Acconto non dovuto sotto',
  'advancePayment.firstInstallmentPct': 'Prima rata dell\'acconto',
  'advancePayment.singleIfFirstInstallmentAtMost': 'Acconto in unica soluzione se la prima rata non supera',
  'advancePayment.isaSubjectsFirstInstallmentPct': 'Prima rata dell\'acconto per i soggetti ISA',
  'deadlines.balanceAndFirstAdvance': 'Scadenza di saldo e primo acconto',
  'deadlines.balanceAndFirstAdvanceExtended': 'Scadenza prorogata di saldo e primo acconto',
  'deadlines.deferred': 'Scadenza differita di 30 giorni',
  'deadlines.deferralSurchargePct': 'Maggiorazione per il differimento',
  'deadlines.deferredExtended': 'Scadenza differita dopo la proroga',
  'deadlines.deferralSurchargeExtendedPct': 'Maggiorazione per il differimento dopo la proroga',
  'deadlines.secondAdvance': 'Scadenza del secondo acconto',
  'deadlines.taxReturnFiling': 'Termine di presentazione della dichiarazione',
  'deadlines.installmentDay': 'Giorno di scadenza delle rate',
  'deadlines.installmentsEnd': 'Ultima rata entro',
  'deadlines.augustDeferral': 'Scadenze di agosto spostate al',
  installments: 'Interessi di rateazione',
  'installments.annualInterestPct': 'Tasso annuo degli interessi di rateazione',
  'inps.fullRatePct': 'Aliquota INPS Gestione separata',
  'inps.reducedRatePct': 'Aliquota INPS ridotta (pensionati o altra previdenza)',
  'inps.incomeCeiling': 'Massimale di reddito INPS',
  'inps.incomeFloor': 'Minimale di reddito INPS',
  'inps.advancePct': 'Misura di ciascun acconto INPS',
  'inps.advanceInstallments': 'Numero di acconti INPS',
  'inps.surchargePct': 'Rivalsa INPS in fattura',
  'inps.advanceRateYear': 'Aliquote dell\'anno per l\'acconto INPS',
  stampDuty: 'Scadenze e differimenti dell\'imposta di bollo',
  'stampDuty.amount': 'Importo dell\'imposta di bollo',
  'stampDuty.threshold': 'Soglia dell\'imposta di bollo',
  taxCodes: 'Codici tributo',
  inpsReasons: 'Causali INPS e periodo di riferimento',
  'inpsReasons.table': 'Tabella delle causali INPS',
  eInvoice: 'Codici della fattura elettronica',
  'eInvoice.specVersion': 'Versione delle specifiche FatturaPA',
  'eInvoice.regimeNote': 'Dicitura del regime forfettario',
  'eInvoice.noWithholdingNote': 'Dicitura di esclusione dalla ritenuta',
  'eInvoice.euAnnotation': 'Annotazione per i clienti UE',
  'eInvoice.nonEuAnnotation': 'Annotazione per i clienti extra UE',
  'eInvoice.issueDays': 'Termine di emissione della fattura',
  'eInvoice.foreignIssueDayOfNextMonth': 'Termine di emissione per i clienti esteri',
  taxNotices: 'Avvisi bonari',
  'taxNotices.summerSuspension': 'Sospensione estiva degli avvisi bonari',
  penalties: 'Sanzioni per omesso versamento',
  intrastat: 'Elenchi Intrastat dei servizi',
};

const isMonthDay = (v: unknown): v is { month: number; day: number } =>
  !!v && typeof v === 'object' && Object.keys(v).length === 2 && 'month' in v && 'day' in v;

/** A rule set value as text; null for sections and tables, which have no single value. */
export function ruleValueLabel(key: string, value: unknown): string | null {
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : value;
  if (typeof value === 'number') {
    const n = value.toLocaleString('it-IT');
    if (/Pct$/.test(key)) return `${n}%`;
    if (/Threshold$|Ceiling$|Floor$|notDueBelow|AtMost$|\.amount$|\.threshold$/.test(key)) return `${value.toLocaleString('it-IT', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2 })} €`;
    return n;
  }
  if (isMonthDay(value)) return `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}`;
  if (value && typeof value === 'object' && 'from' in value && 'to' in value && isMonthDay(value.from) && isMonthDay(value.to)) {
    return `dal ${ruleValueLabel('', value.from)} al ${ruleValueLabel('', value.to)}`;
  }
  return null;
}
