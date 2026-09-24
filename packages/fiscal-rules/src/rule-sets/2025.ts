import type { FiscalRuleSet } from '../rule-set.js';
import { ruleSet2026 } from './2026.js';

/**
 * Fiscal rules for 2025 (payment year; Redditi PF 2025 return covers tax year 2024).
 * Used as the income-year set for 2025 income (rates, coefficient, INPS rate and ceiling)
 * and as the payment-year set for what was paid in 2025. Derived from the 2026 set: only
 * the values that differ in 2025 are overridden, each with its own source below.
 * Must be explicitly activated by the platform admin.
 */

const INPS_C27 =
  'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2025.01.circolare-numero-27-del-30-01-2025_14807.html';
const NORM_DL84_13 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2025-06-17;84~art13!vig=';
const NORM_DLGS1_8 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2024-01-08;1~art8!vig=';
const NORM_DL223_37 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2006-07-04;223~art37!vig=';
const NORM_DPR322_2 =
  'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1998-07-22;322~art2!vig=';
const ADE_SPEC_19 = 'https://www.agenziaentrate.gov.it/portale/specifiche-tecniche-versione-1.9';
const ADE_PF3_2026 = 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf3_istruzioni_2026_agg-13-05-2026';

const V = '2026-09-21';

export const ruleSet2025: FiscalRuleSet = {
  ...ruleSet2026,
  year: 2025,

  deadlines: {
    balanceAndFirstAdvance: '2025-06-30',
    balanceAndFirstAdvanceExtended: '2025-07-21',
    deferred: '2025-07-30',
    deferralSurchargePct: 0.4,
    deferredExtended: '2025-08-20',
    deferralSurchargeExtendedPct: 0.4,
    secondAdvance: '2025-11-30',
    taxReturnFiling: '2025-10-31',
    installmentDay: 16,
    installmentsEnd: { month: 12, day: 16 },
    augustDeferral: { month: 8, day: 20 },
  },

  inps: {
    ...ruleSet2026.inps,
    fullRatePct: 26.07,
    reducedRatePct: 24,
    incomeCeiling: 120_607,
    incomeFloor: 18_555,
  },

  stampDuty: {
    ...ruleSet2026.stampDuty,
    deadlines: [
      { quarter: 1, date: '2025-05-31', taxCode: '2521' },
      { quarter: 2, date: '2025-09-30', taxCode: '2522' },
      { quarter: 3, date: '2025-11-30', taxCode: '2523' },
      { quarter: 4, date: '2026-02-28', taxCode: '2524' },
    ],
  },

  eInvoice: { ...ruleSet2026.eInvoice, specVersion: '1.9' },

  sourceRefs: {
    ...ruleSet2026.sourceRefs,
    'flatRate.employmentIncomeThreshold': { url: ADE_PF3_2026, title: 'Redditi PF 2026 instructions, booklet 3, LM section III (2025 income)', quote: 'per gli anni 2025 e 2026, il predetto limite è elevato a 35.000 euro (art. 1, comma 27, legge 30 dicembre 2025, n. 199)', verifiedOn: V },
    'deadlines.deferredExtended': { url: NORM_DL84_13, title: 'DL 17 June 2025 no. 84, art. 13 (the 30th day after 21/07/2025 is 20/08/2025)', quote: 'Per il 2025 è consentito effettuare i versamenti ... entro il trentesimo giorno successivo al 21 luglio 2025, maggiorando le somme da versare dello 0,40 per cento', verifiedOn: '2026-09-24' },
    'deadlines.balanceAndFirstAdvanceExtended': { url: NORM_DL84_13, title: 'DL 17 June 2025 no. 84, art. 13', quote: 'effettuano i predetti versamenti entro il 21 luglio 2025 senza alcuna maggiorazione. Per il 2025 è consentito effettuare i versamenti ... entro il trentesimo giorno successivo al 21 luglio 2025, maggiorando le somme da versare dello 0,40 per cento ... nonché quelli che applicano il regime forfetario', verifiedOn: V },
    'deadlines.installmentsEnd': { url: NORM_DLGS1_8, title: 'D.Lgs. 1/2024 art. 8 (art. 20 D.Lgs. 241/97 as amended, from the 2023 balance)', quote: 'le parole: «mese di novembre» sono sostituite dalle seguenti: «16 dicembre» ... «4. I versamenti rateali sono effettuati entro il giorno 16 di ciascun mese.»', verifiedOn: V },
    'deadlines.augustDeferral': { url: NORM_DL223_37, title: 'DL 223/2006 art. 37 par. 11-bis (in force for 2025)', quote: 'che hanno scadenza dal 1º al 20 agosto di ogni anno, possono essere effettuati entro il giorno 20 dello stesso mese, senza alcuna maggiorazione', verifiedOn: V },
    'deadlines.taxReturnFiling': { url: NORM_DPR322_2, title: 'DPR 322/1998 art. 2 par. 1 (31 October; 2025: Friday)', quote: 'entro il 31 ottobre dell\'anno successivo a quello di chiusura del periodo di imposta', verifiedOn: V },
    'inps.fullRatePct': { url: INPS_C27, title: 'INPS circular no. 27 of 30/01/2025, par. 2 and 4', quote: 'Soggetti non assicurati presso altra forma di previdenza obbligatoria 26,07%', verifiedOn: V },
    'inps.reducedRatePct': { url: INPS_C27, title: 'INPS circular no. 27 of 30/01/2025, par. 2', quote: "l'anno 2025, l'aliquota è confermata al 24%", verifiedOn: V },
    'inps.incomeCeiling': { url: INPS_C27, title: 'INPS circular no. 27 of 30/01/2025, par. 6.1', quote: 'Per l\'anno 2025 il massimale di reddito ... è pari a 120.607,00 euro', verifiedOn: V },
    'inps.incomeFloor': { url: INPS_C27, title: 'INPS circular no. 27 of 30/01/2025, par. 6.2', quote: 'Per l\'anno 2025 il minimale di reddito ... è pari a 18.555,00 euro', verifiedOn: V },
    'inps.advanceRateYear': { url: INPS_C27, title: 'INPS circular no. 27 of 30/01/2025, par. 4.2', quote: "l'acconto per l'anno di imposta 2025 deve essere calcolato applicando le aliquote in vigore per l'anno 2025", verifiedOn: V },
    'stampDuty': { url: ruleSet2026.sourceRefs['stampDuty'].url, title: 'DM 17/06/2014 art. 6 par. 2 (deadlines table in the AdE stamp duty guide, June 2026): last day of the second month after the quarter, Q3 by 30 November', quote: ruleSet2026.sourceRefs['stampDuty'].quote, verifiedOn: V },
    'eInvoice.specVersion': { url: ADE_SPEC_19, title: 'AdE, technical specifications v. 1.9 (usable from 1 April 2025)', quote: 'Specifiche tecniche versione 1.9 ... utilizzabili dal 1° aprile 2025', verifiedOn: V },
  },
};
