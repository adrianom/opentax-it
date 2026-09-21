import type { FiscalRuleSet } from '../rule-set.js';

/**
 * Fiscal rules for 2026 (payment year; Redditi PF 2026 return covers tax year 2025).
 * Every value is verified against an official source: see sourceRefs and
 * docs/normativa-2026.md. Must be explicitly activated by the platform admin.
 */

const ADE_PF1 =
  'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf1_istruzioni_2026_agg-28-05-2026';
const ADE_PF3 =
  'https://www.agenziaentrate.gov.it/portale/documents/d/guest/pf3_istruzioni_2026_agg-13-05-2026';
const NORM_L190 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190~art1!vig=';
const GU_TU33 = 'https://www.gazzettaufficiale.it/eli/id/2025/03/26/25G00044/sg';
const GU_DL89 = 'https://www.gazzettaufficiale.it/eli/id/2026/05/22/26G00110/SG';
const INPS_C8 =
  'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.02.circolare-numero-8-del-03-02-2026_15153.html';
const NORM_L662 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1996-12-23;662~art1!vig=';
const ADE_STAMP =
  'https://www.agenziaentrate.gov.it/portale/documents/d/guest/l-imposta_di_bollo_sulle_fatture_elettronichegiugno2026';
const ADE_INPS_REASONS =
  'https://www.agenziaentrate.gov.it/portale/documents/20143/448438/Causali_INPS_02_07_2026.xls/96c9091f-6df9-60c6-c0e2-8fd5aef19fee';
const ADE_SPEC = 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/allegato-a-specifiche-tecniche-vers-1-9-1';
const ADE_EINVOICE_GUIDE = 'https://www.agenziaentrate.gov.it/portale/documents/d/guest/guida_fattura_elettronica_dicembre_2025';
const NORM_DPR633_21 =
  'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1972-10-26;633~art21!vig=';
const NORM_D462 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1997-06-18;462~art2!vig=';
const NORM_D471 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1997-12-18;471~art13!vig=';
const ADM_INTRASTAT =
  'https://www.adm.gov.it/portale/documents/20182/99139401/IL+SISTEMA+INTRASTAT_2023.pdf/363491a4-2a11-5ea2-10f8-383a44be0f9e';

const INPS_F24_SHEET =
  'https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49920.F24-per-professionisti-iscritti-alla-Gestione-Separata.html';

const NORM_DPR435_17 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2001-12-07;435~art17!vig=';
const NORM_DL124_58 = 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2019-10-26;124~art58!vig=';

const V = '2026-09-19';

export const ruleSet2026: FiscalRuleSet = {
  year: 2026,

  flatRate: {
    revenueThreshold: 85_000,
    immediateExitThreshold: 100_000,
    employeeCostThreshold: 20_000,
    employmentIncomeThreshold: 35_000,
    standardRatePct: 15,
    reducedRatePct: 5,
    reducedRateYears: 5,
    // Annex 4 L. 190/2014 (ATECO 2007), valid until the ATECO 2025 coefficients are approved (D.Lgs. 81/2025 art. 1).
    profitabilityByAteco: {
      '10': 40, '11': 40,
      '45': 40, '46': 40, '46.1': 62, '47': 40,
      '47.82': 54, '47.83': 54, '47.84': 54, '47.85': 54, '47.86': 54, '47.87': 54, '47.88': 54, '47.89': 54,
      '41': 86, '42': 86, '43': 86, '68': 86,
      '55': 40, '56': 40,
      '64': 78, '65': 78, '66': 78, '69': 78, '70': 78, '71': 78, '72': 78, '73': 78, '74': 78, '75': 78,
      '85': 78, '86': 78, '87': 78, '88': 78,
      '01': 67, '02': 67, '03': 67, '05': 67, '06': 67, '07': 67, '08': 67, '09': 67,
      '12': 67, '13': 67, '14': 67, '15': 67, '16': 67, '17': 67, '18': 67, '19': 67, '20': 67, '21': 67,
      '22': 67, '23': 67, '24': 67, '25': 67, '26': 67, '27': 67, '28': 67, '29': 67, '30': 67, '31': 67,
      '32': 67, '33': 67, '35': 67, '36': 67, '37': 67, '38': 67, '39': 67,
      '49': 67, '50': 67, '51': 67, '52': 67, '53': 67, '58': 67, '59': 67, '60': 67, '61': 67, '62': 67, '63': 67,
      '77': 67, '78': 67, '79': 67, '80': 67, '81': 67, '82': 67, '84': 67,
      '90': 67, '91': 67, '92': 67, '93': 67, '94': 67, '95': 67, '96': 67, '97': 67, '98': 67, '99': 67,
    },
  },

  advancePayment: {
    percentage: 100,
    notDueBelow: 51.65,
    singleIfFirstInstallmentAtMost: 103,
    firstInstallmentPct: 40,
    isaSubjectsFirstInstallmentPct: 50,
  },

  deadlines: {
    balanceAndFirstAdvance: '2026-06-30',
    balanceAndFirstAdvanceExtended: '2026-07-20',
    deferred: '2026-07-30',
    deferralSurchargePct: 0.4,
    deferredExtended: '2026-08-19',
    deferralSurchargeExtendedPct: 0.8,
    secondAdvance: '2026-11-30',
    taxReturnFiling: '2026-11-02',
    installmentDay: 16,
    installmentsEnd: { month: 12, day: 16 },
    augustDeferral: { month: 8, day: 20 },
  },

  installments: { annualInterestPct: 4, incrementPct: 0.33 },

  inps: {
    fullRatePct: 26.07,
    reducedRatePct: 24,
    incomeCeiling: 122_295,
    incomeFloor: 18_808,
    advancePct: 80,
    advanceInstallments: 2,
    surchargePct: 4,
  },

  stampDuty: {
    amount: 2,
    threshold: 77.47,
    deferralThreshold: 5_000,
    deadlines: [
      { quarter: 1, date: '2026-05-31', taxCode: '2521' },
      { quarter: 2, date: '2026-09-30', taxCode: '2522' },
      { quarter: 3, date: '2026-11-30', taxCode: '2523' },
      { quarter: 4, date: '2027-02-28', taxCode: '2524' },
    ],
  },

  taxCodes: {
    substituteTaxBalance: '1792',
    substituteTaxFirstAdvance: '1790',
    substituteTaxSecondAdvance: '1791',
    installmentInterest: '1668',
  },

  inpsReasons: { contribution: 'PXX', contributionReducedRate: 'P10', installments: 'PXXR', installmentsReducedRate: 'P10R', interest: 'DPPI' },

  eInvoice: {
    specVersion: '1.9.1',
    taxRegime: 'RF19',
    domesticNature: 'N2.2',
    foreignNature: 'N2.1',
    inpsFundType: 'TC22',
    regimeNote:
      "Operazione effettuata in regime forfettario ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni",
    noWithholdingNote:
      "Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, Legge n. 190 del 2014 e successive modificazioni",
    euAnnotation: 'inversione contabile',
    nonEuAnnotation: 'operazione non soggetta',
    foreignRecipientCode: 'XXXXXXX',
    issueDays: 12,
    foreignIssueDayOfNextMonth: 15,
  },

  taxNotices: {
    paymentDays: 60,
    penaltyReduction: '1/3',
    maxQuarterlyInstallments: 20,
    summerSuspension: { from: { month: 8, day: 1 }, to: { month: 9, day: 4 } },
  },

  penalties: { latePaymentPct: 25, reductionWithin90Days: '1/2', reductionWithin15Days: '1/15 per day' },

  intrastat: { quarterlyServicesThreshold: 50_000, dueDay: 25 },

  sourceRefs: {
    'flatRate.revenueThreshold': { url: NORM_L190, title: 'L. 190/2014 art. 1 par. 54 lett. a)', quote: 'hanno conseguito ricavi ovvero hanno percepito compensi, ragguagliati ad anno, non superiori a euro 85.000', verifiedOn: V },
    'flatRate.immediateExitThreshold': { url: NORM_L190, title: 'L. 190/2014 art. 1 par. 71', quote: "Il regime forfetario cessa di avere applicazione dall'anno stesso in cui i ricavi o i compensi percepiti sono superiori a 100.000 euro", verifiedOn: V },
    'flatRate.employeeCostThreshold': { url: NORM_L190, title: 'L. 190/2014 art. 1 par. 54 lett. b)', quote: 'spese per un ammontare complessivamente non superiore ad euro 20.000 lordi', verifiedOn: V },
    'flatRate.employmentIncomeThreshold': { url: ADE_PF3, title: 'Redditi PF 2026 instructions, booklet 3, LM section III', quote: 'per gli anni 2025 e 2026, il predetto limite è elevato a 35.000 euro (art. 1, comma 27, legge 30 dicembre 2025, n. 199)', verifiedOn: V },
    'flatRate.standardRatePct': { url: NORM_L190, title: 'L. 190/2014 art. 1 par. 64', quote: 'imposta sostitutiva ... pari al 15 per cento', verifiedOn: V },
    'flatRate.reducedRatePct': { url: NORM_L190, title: 'L. 190/2014 art. 1 par. 65', quote: "per il periodo d'imposta in cui l'attività è iniziata e per i quattro successivi, l'aliquota ... è stabilita nella misura del 5 per cento", verifiedOn: V },
    'flatRate.profitabilityByAteco': { url: ADE_PF3, title: 'Redditi PF 2026 instructions, booklet 3, profitability table; D.Lgs. 81/2025 art. 1', quote: 'Altre attività economiche ... (58-59-60-61-62-63) ... 67%', verifiedOn: V },
    'advancePayment': { url: ADE_PF1, title: 'Redditi PF 2026 instructions, booklet 1, row RN62; art. 72 D.Lgs. 33/2025', quote: "in unica soluzione entro il 30 novembre 2026 se l'importo dovuto è inferiore ad euro 257,52 (il cui 40 per cento, infatti, è pari ad euro 103,00) ... la prima, nella misura del 40 per cento ... la seconda, nella restante misura del 60 per cento", verifiedOn: V },
    'advancePayment.singleIfFirstInstallmentAtMost': { url: NORM_DPR435_17, title: 'DPR 435/2001 art. 17 par. 3', quote: 'sono effettuati in due rate salvo che il versamento da effettuare alla scadenza della prima rata non superi euro 103. Il quaranta per cento dell\'acconto dovuto è versato alla scadenza della prima rata e il residuo importo alla scadenza della seconda', verifiedOn: '2026-09-21' },
    'advancePayment.isaSubjectsFirstInstallmentPct': { url: NORM_DL124_58, title: 'DL 124/2019 art. 58; AdE resolution 93/E of 12/11/2019; Redditi PF 2026 instructions, booklet 2, LM advances', quote: 'in due rate ciascuna nella misura del 50 per cento (art. 58); si applica anche ai contribuenti che applicano il regime forfetario ... anche all\'imposta sostitutiva delle imposte sui redditi ... dovuta dai contribuenti che si avvalgono di forme di determinazione del reddito con criteri forfetari (ris. 93/E); Per i soggetti che esercitano attività economiche per le quali sono stati approvati gli ISA, i versamenti in acconto dell\'imposta sostitutiva sono effettuati in due rate ciascuna nella misura del 50 per cento (istruzioni)', verifiedOn: '2026-09-21' },
    'deadlines.balanceAndFirstAdvanceExtended': { url: GU_DL89, title: 'DL 22 May 2026 no. 89, art. 6', quote: 'effettuano i predetti versamenti entro il 20 luglio 2026 senza alcuna maggiorazione, ovvero entro il trentesimo giorno successivo al 20 luglio 2026, maggiorando le somme da versare dello 0,80 per cento', verifiedOn: V },
    'deadlines.deferred': { url: ADE_PF1, title: 'Redditi PF 2026 instructions, booklet 1, "Rateazione"; art. 17 par. 2 DPR 435/2001', quote: 'differimento dal 30 giugno 2026 al 30 luglio 2026 ... maggiorare preventivamente gli importi della misura dello 0,40 per cento', verifiedOn: V },
    'deadlines.taxReturnFiling': { url: ADE_PF1, title: 'Redditi PF 2026 instructions, booklet 1, filing terms', quote: 'dal 15 aprile 2026 al 2 novembre 2026 (dal momento che il 31 ottobre 2026 è sabato)', verifiedOn: V },
    'deadlines.installmentsEnd': { url: GU_TU33, title: 'D.Lgs. 33/2025 art. 10 par. 1 and 4', quote: 'il pagamento deve essere completato entro il 16 dicembre ... I versamenti rateali sono effettuati entro il giorno 16 di ciascun mese', verifiedOn: V },
    'deadlines.augustDeferral': { url: GU_TU33, title: 'D.Lgs. 33/2025 art. 11', quote: 'che hanno scadenza dal 1° al 20 agosto di ogni anno, possono essere effettuati entro il giorno 20 dello stesso mese, senza alcuna maggiorazione', verifiedOn: V },
    'installments': { url: ADE_PF1, title: 'Redditi PF 2026 instructions, booklet 1, "Rateazione"', quote: "interessi nella misura del 4 per cento annuo, da calcolarsi secondo il metodo commerciale, tenendo conto del periodo decorrente dal giorno successivo a quello di scadenza della prima rata fino alla data di scadenza della seconda ... Sugli importi da versare con le rate mensili successive, si applicano gli interessi dello 0,33 per cento in misura forfetaria", verifiedOn: '2026-09-21' },
    'installments.annualInterestPct': { url: 'https://www.gazzettaufficiale.it/atto/serie_generale/caricaDettaglioAtto/originario?atto.dataPubblicazioneGazzetta=2009-06-15&atto.codiceRedazionale=09A06833', title: 'DM 21 maggio 2009 art. 5', quote: 'Gli interessi per i pagamenti rateali ... sono dovuti nella misura del 4 per cento annuo', verifiedOn: '2026-09-21' },
    'inps.fullRatePct': { url: INPS_C8, title: 'INPS circular no. 8 of 3/2/2026, par. 2', quote: 'Soggetti non assicurati presso altra forma di previdenza obbligatoria 26,07% (25,00 IVS + 0,72 aliquota aggiuntiva + 0,35 ISCRO)', verifiedOn: V },
    'inps.reducedRatePct': { url: INPS_C8, title: 'INPS circular no. 8 of 3/2/2026, par. 2', quote: "pensionati o assicurati presso altre forme di previdenza obbligatorie ... l'aliquota è confermata al 24%", verifiedOn: V },
    'inps.incomeCeiling': { url: INPS_C8, title: 'INPS circular no. 8 of 3/2/2026, par. 6.1', quote: 'il massimale di reddito ... è pari a 122.295,00 euro', verifiedOn: V },
    'inps.incomeFloor': { url: INPS_C8, title: 'INPS circular no. 8 of 3/2/2026, par. 6.2', quote: 'il minimale di reddito ... è pari a 18.808,00 euro', verifiedOn: V },
    'inps.advancePct': { url: NORM_L662, title: 'L. 662/1996 art. 1 par. 212', quote: "un acconto del contributo dovuto, nella misura corrispondente al 40 per cento dell'importo dovuto sui redditi di lavoro autonomo risultanti dalla dichiarazione dei redditi relativa all'anno precedente (lett. a and b)", verifiedOn: V },
    'inps.surchargePct': { url: NORM_L662, title: 'L. 662/1996 art. 1 par. 212', quote: 'hanno titolo ad addebitare ai committenti ... una percentuale nella misura del 4 per cento dei compensi lordi', verifiedOn: V },
    'stampDuty': { url: ADE_STAMP, title: 'AdE guide "L\'imposta di bollo sulle fatture elettroniche", June 2026', quote: "1° trimestre 31 maggio; 2° 30 settembre; 3° 30 novembre; 4° 28 febbraio. Se l'importo dovuto per il primo trimestre non supera 5.000 euro ... entro il 30 settembre", verifiedOn: V },
    'taxCodes': { url: ADE_PF1, title: 'Redditi PF 2026 instructions, booklet 1, main tax codes', quote: '1792 saldo; 1790 acconto prima rata; 1791 acconto seconda rata o unica soluzione; 1668 interessi pagamento dilazionato', verifiedOn: V },
    'inpsReasons': { url: INPS_F24_SHEET, title: 'INPS, "F24 per professionisti iscritti alla Gestione Separata" (agg. 8/7/2025)', quote: "possono essere rateizzati (aggiungendo una \"R\" alla causale contributi correnti P10 o PXX). Sia in caso di differimento che di rateizzazione, la maggiorazione per interessi deve essere esposta ... utilizzando la causale contributo \"DPPI\" ... periodo di riferimento \"da\" (esempio 012025) ... \"a\" (esempio 122025)", verifiedOn: '2026-09-21' },
    'inpsReasons.table': { url: ADE_INPS_REASONS, title: 'INPS contribution reasons table (AdE, 02/07/2026)', quote: 'P10-PXX Gestione Professionisti; P10R-PXXR Gestione Professionisti - Rate e interessi; DPPI Gestione 10% professionisti - Rate ed interessi', verifiedOn: '2026-09-20' },
    'eInvoice': { url: ADE_SPEC, title: 'FatturaPA technical specifications v. 1.9.1 (from 15/05/2026)', quote: 'RF19 Regime forfettario; N2.1 non soggette artt. 7-7-septies; N2.2 non soggette altri casi; TC22 INPS; XXXXXXX per soggetti non stabiliti', verifiedOn: '2026-09-20' },
    'eInvoice.regimeNote': { url: ADE_EINVOICE_GUIDE, title: 'AdE e-invoice guide, December 2025, "Fattura elettronica per i forfettari"', quote: 'dovrà ... valorizzarlo con la seguente dicitura: "Operazione effettuata in regime forfettario ai sensi dell\'articolo 1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni"', verifiedOn: V },
    'eInvoice.euAnnotation': { url: NORM_DPR633_21, title: 'DPR 633/72 art. 21 par. 6-bis', quote: "con l'annotazione «inversione contabile» ... con l'annotazione \"operazione non soggetta\"", verifiedOn: V },
    'eInvoice.issueDays': { url: NORM_DPR633_21, title: 'DPR 633/72 art. 21 par. 4', quote: "La fattura è emessa entro dodici giorni dall'effettuazione dell'operazione ... entro il giorno 15 del mese successivo (lett. c and d)", verifiedOn: V },
    'taxNotices': { url: NORM_D462, title: 'D.Lgs. 462/1997 art. 2 par. 2 and art. 3-bis', quote: 'entro sessanta giorni dal ricevimento della comunicazione ... le sanzioni ... ridotto ad un terzo ... numero massimo di venti rate trimestrali', verifiedOn: '2026-09-20' },
    'penalties': { url: NORM_D471, title: 'D.Lgs. 471/1997 art. 13 par. 1', quote: 'sanzione amministrativa pari al venticinque per cento di ogni importo non versato ... ritardo non superiore a novanta giorni, la sanzione ... è ridotta alla metà ... un quindicesimo per ciascun giorno di ritardo', verifiedOn: '2026-09-20' },
    'intrastat': { url: ADM_INTRASTAT, title: 'ADM, "Il sistema Intrastat" (2023) and Det. 493869/2021', quote: 'Cessione di servizi: ammontare < 50.000 euro in tutti e 4 i trim prec: Modello Trimestrale ... entro il 25 del mese successivo', verifiedOn: '2026-09-20' },
  },
};
