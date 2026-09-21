# Matrice di conformità — feature → riferimento istituzionale

Ogni funzionalità del software è ancorata a una fonte ufficiale. Quando si aggiunge o modifica una feature, va aggiornata questa tabella e il commento in testa al modulo che la implementa. Dettagli e citazioni in [normativa-2026.md](normativa-2026.md).

| Feature | Modulo | Riferimento istituzionale | Verificato |
|---|---|---|---|
| Set di regole per anno, attivazione manuale da admin | `packages/fiscal-rules/src/rule-set.ts`, `apps/api/src/fiscal-rules` | Principio: valori da norma primaria + istruzioni AdE/INPS dell'anno; nessuna auto-applicazione. Fonti per singolo valore in `rule-sets/2026.ts` → `sourceRefs` | 2026-09-19/20 |
| Soglie 85.000 / 100.000 €, aliquote 15% / 5%, deducibilità contributi, principio di cassa | `rule-sets/2026.ts` → `flatRate` | L. 190/2014 art. 1 c. 54, 64, 65, 71 (Normattiva, testo vigente); Istr. Redditi PF 2026 Fasc. 3 quadro LM | 2026-09-19 |
| Coefficienti di redditività per ATECO | `rule-set.ts` → `profitabilityCoefficient` | L. 190/2014 all. 4 (ATECO 2007); D.Lgs. 81/2025 art. 1 (transitorio ATECO 2025); tabella Istr. Fasc. 3 | 2026-09-19 |
| Soglia redditi dipendente 35.000 € (2025-2026) | `flatRate.employmentIncomeThreshold` | L. 199/2025 art. 1 c. 27 (via Istr. Fasc. 3) | 2026-09-19 |
| Acconti: 100%, soglie 51,65 / 257,52 €, 40% + 60% | `advancePayment` | D.Lgs. 33/2025 art. 72 (GU S.O. 8/2025); Istr. Redditi PF 2026 Fasc. 1 rigo RN62; L. 190/2014 c. 64 ultimo periodo | 2026-09-20 |
| Scadenze 30/6, 30/11; differimento 30/7 +0,40% | `deadlines` | DPR 435/2001 art. 17; Istr. Fasc. 1 | 2026-09-19 |
| Proroga 2026: 20/7 senza maggiorazione, 19/8 +0,80% | `deadlines.balanceAndFirstAdvanceExtended` | DL 89/2026 art. 6 (GU n. 117 del 22/05/2026) | 2026-09-19 |
| Rate mensili al 16, fine 16/12; interessi 4% annuo con **metodo commerciale** sulla 2ª rata (dal giorno dopo la 1ª alla scadenza nominale della 2ª, mesi di 30 giorni) e +0,33% forfettario sulle successive | `installment-plan.ts` | D.Lgs. 33/2025 art. 10; DM 21/05/2009 art. 5 (4% annuo, GU 15/06/2009); Istr. Fasc. 1 §Rateazione (testo della regola). Il metodo riproduce il prospetto ufficiale per 30/6 e 30/7 e gli importi di due F24 reali 2026 (rate 3 e 4 di 5, partenza 20/7): test nel package | 2026-09-21 |
| Slittamento 1-20 agosto → 20 agosto | `installment-plan.ts`, `deadlines.augustDeferral` | D.Lgs. 33/2025 art. 11 | 2026-09-20 |
| Slittamento sabato/festivi a giorno lavorativo | `calendar.ts` | DL 70/2011 art. 7 c. 1 lett. h) e c. 2 lett. l) (testo vigente letto su Normattiva); applicazione nelle Istr. Fasc. 1 (31/10/2026 → 2/11/2026) | 2026-09-21 |
| Termine presentazione Redditi PF | `deadlines.taxReturnFiling` | Istr. Fasc. 1 (15/4 – 2/11/2026) | 2026-09-19 |
| INPS GS: 26,07% / 24%, massimale 122.295, minimale 18.808 | `inps` | Circolare INPS n. 8 del 3/2/2026 §2, §6 | 2026-09-19 |
| INPS acconti 40% + 40%, rivalsa 4% | `inps.advancePct`, `inps.surchargePct` | L. 662/1996 art. 1 c. 212 (Normattiva) | 2026-09-19 |
| Codici tributo 1790/1791/1792/1668 | `taxCodes` | Istr. Fasc. 1 "Principali codici tributo" | 2026-09-19 |
| Codice sede INPS nel profilo, validato sulla tabella ufficiale (colonna "altri contributi") | `inps-offices.ts` (id univoco per riga: il codice non è univoco nella tabella, es. 8103), `TenantProfile.inpsOfficeId` | Scheda INPS "F24 per professionisti iscritti alla GS" (sede "in base alla residenza"); AdE "Tabella codici sede INPS" | 2026-09-21 |
| Causali INPS: PXX (unica soluzione), PXXR (rate), DPPI (interessi differimento/rate), P10/P10R per aliquota 24%; codice sede per residenza; periodo 01AAAA–12AAAA | `inpsReasons` | Scheda INPS "F24 per professionisti iscritti alla Gestione Separata" (agg. 8/7/2025); tabella causali AdE (02/07/2026) | 2026-09-21 |
| Bollo 2 € > 77,47 €, scadenze trimestrali, soglia 5.000 €, codici 2521-2524 | `stampDuty` | DM 17/06/2014 art. 6; Guida AdE bollo FE giugno 2026 | 2026-09-19 |
| Differimento del bollo in base agli importi reali del tenant: 1° trim. con il 2° se ≤ 5.000 €; 1° e 2° con il 3° (30/11) se 1°+2° ≤ 5.000 € | `deadlines.ts` (`stampDutyByQuarter`), `fiscal-rules.service.ts` → `stampDutyByQuarter` | Guida AdE bollo FE giugno 2026, note (*) e (**) alla tabella delle scadenze | 2026-09-21 |
| Obbligo fattura elettronica forfettari | (design) | DL 36/2022 art. 18 c. 2-3 | 2026-09-19 |
| Termine emissione 12 gg; estero entro il 15 del mese successivo | `eInvoice.issueDays` | DPR 633/72 art. 21 c. 4 | 2026-09-19 |
| XML FatturaPA: struttura, ordine elementi, tipi, pattern testo | `packages/fatturapa/src/builder.ts` + XSD in `schemas/` | Specifiche tecniche AdE v1.9.1 (Allegato A); XSD Schema_VFPR12_v1.2.3 (validazione xmllint nei test) | 2026-09-21 |
| RF19, N2.2 nazionale, N2.1 estero, diciture c. 54-89 e c. 67, bollo nel totale | `eInvoice`, `builder.ts` | Guida AdE FE dicembre 2025 "Fattura elettronica per i forfettari"; Spec. 1.9.1 | 2026-09-19 |
| Annotazioni "inversione contabile" / "operazione non soggetta" | `eInvoice.euAnnotation` | DPR 633/72 art. 21 c. 6-bis | 2026-09-19 |
| Operazioni UE art. 21 c. 6-bis lett. a): "INVCONT" in AltriDatiGestionali/TipoDato su ogni riga | `builder.ts` (`lineManagementData`), `invoices.service.ts` | Guida AdE alla compilazione FE ed esterometro v1.10 (aprile 2025), codice N2.1 | 2026-09-21 |
| Clienti esteri: IdPaese ≠ IT, IdCodice alfanumerico max 28 (anche per consumatori), CodiceFiscale vuoto, CAP "00000", nessuna Provincia | `customers.service.ts`, `builder.ts` → `validateInvoice` | FAQ AdE "Fatture verso e da soggetti stranieri (transfrontaliere)" | 2026-09-21 |
| N2.2 per i forfettari | `eInvoice.domesticNature` | Guida AdE compilazione FE v1.10: "Il codice N2.2 deve essere adoperato anche dall'operatore in regime forfettario" | 2026-09-21 |
| Bollo anche sulle note di credito (TD04) sopra 77,47 € | `invoices.service.ts` | Guida AdE bollo FE giugno 2026: criteri elenco B (natura N2.1/N2.2… e importo > 77,47 €); esclusi solo TD16-TD19, TD28 e i regimi RF05-RF09 | 2026-09-21 |
| CodiceDestinatario XXXXXXX per esteri (errore 00313) | `builder.ts` → `validateInvoice` | Spec. 1.9.1 §2.1.1 | 2026-09-20 |
| Rivalsa INPS in fattura: TipoCassa TC22 | `socialSecurityFund` | Spec. 1.9.1 tabella TipoCassa | 2026-09-20 |
| Note di credito TD04 con DatiFattureCollegate | `builder.ts` | Spec. 1.9.1 (TipoDocumento; controllo unicità con TD04) | 2026-09-21 |
| Nome file IT<CF>_<progressivo>.xml | `invoiceFileName` | Spec. 1.9.1 §1.2.2 | 2026-09-21 |
| Incassi per fattura (anche parziali, rimborsi negativi); ricavi dell'anno = somma incassi (principio di cassa) | `apps/api/src/payments` | L. 190/2014 art. 1 c. 64 ("ricavi o compensi percepiti"); Istr. Redditi PF 2026 Fasc. 3, LM sez. III "Determinazione del reddito" | 2026-09-21 |
| Reddito = incassato × coefficiente; contributi dedotti nel limite della capienza; imposta 15%/5% (anno inizio + 4) | `packages/fiscal-rules/src/tax-computation.ts` → `computeTaxes`, `reducedRateApplies` | L. 190/2014 c. 64, 65; Istr. Fasc. 3 righi LM22, LM34, LM35, LM36, LM39 | 2026-09-21 |
| Base INPS = reddito lordo entro il massimale; contributo = base × aliquota | `computeTaxes` (`inpsTaxableIncome`, `inpsContribution`) | Istr. Redditi PF 2026 Fasc. 2, RR sez. II (RR5 col. 11, 14, 15); Circ. INPS 8/2026 | 2026-09-21 |
| Acconto imposta sostitutiva: 100% dell'imposta netta, non dovuto < 51,65, unica soluzione < 257,52, altrimenti 40/60 | `substituteTaxAdvance` | Circ. AdE 10/E/2016 §4 ("si applicano tutte le disposizioni ... in acconto ... dell'IRPEF"); art. 72 D.Lgs. 33/2025; Istr. Fasc. 1 RN62 | 2026-09-21 |
| Acconto INPS 40% + 40% del contributo sul reddito dell'anno, con aliquota dell'anno successivo | `inpsAdvance` | L. 662/1996 art. 1 c. 212; Circ. INPS 8/2026 §4.2 | 2026-09-21 |
| Bollo riaddebitato al cliente = ricavo/compenso (conta per reddito e soglie); esposizione via `DatiBollo` + 2 € nel totale | `invoices.service.ts`, dashboard "emesso" sui totali documento; il reddito usa gli incassi | Risposta AdE n. 428/2022; Guida AdE FE dicembre 2025 (sezione forfettari) | 2026-09-21 |
| Import di fatture da XML FatturaPA emesse altrove (numero originale, XML archiviato, clienti creati) | `packages/fatturapa/src/parser.ts`, `apps/api/src/invoices/invoices-import.service.ts` | Tracciato FatturaPA v1.2.x (Spec. 1.9.1); obbligo di conservazione dei documenti emessi (L. 190/2014 c. 69; DPR 600/73 art. 22) | 2026-09-21 |
| Numerazione progressiva per anno e tipo documento; note di credito serie "NC-" | `apps/api/src/invoices/invoices.service.ts` → `issue` | DPR 633/72 art. 21 c. 2 lett. b) (numero progressivo univoco); Spec. 1.9.1 (unicità nome file e numero, TD04) | 2026-09-21 |
| Calcolo bollo/rivalsa/totale e diciture sulla singola fattura dal set regole dell'anno | `invoices.service.ts` → `prepare` | L. 190/2014 c. 58, 67; L. 662/96 c. 212; DM 17/06/2014; Guida AdE FE dic. 2025 | 2026-09-21 |
| Invio SDI via PEC (sdi01@pec.fatturapa.it, poi indirizzo assegnato) | (design, `TenantProfile.sdiPecAssigned`) | Spec. 1.9.1 §1.5 "servizio PEC" | 2026-09-19 |
| Intrastat servizi resi trimestrale/mensile, 25 del mese | `intrastat`, `deadlines` | Circ. AdE 10/E/2016 §4.1.2; ADM Det. 493869/2021 e guida Intrastat | 2026-09-20 |
| Avvisi bonari: 60 gg, sanzione 1/3, 20 rate trimestrali | `taxNotices` | D.Lgs. 462/1997 art. 2 c. 2 e 3-bis (Normattiva) | 2026-09-20 |
| Sanzione omesso versamento 25% (½ entro 90 gg, 1/15 al giorno entro 15) | `penalties` | D.Lgs. 471/1997 art. 13 | 2026-09-20 |
| I24: F24 con addebito a data futura, annullamento entro terzultimo giorno lavorativo | (design, `F24.i24CancelBy`, `calendar.businessDaysBefore`) | D.Lgs. 1/2024 art. 17; Provv. AdE 313945 del 26/07/2024 | 2026-09-19 |
| CIVIS: registro atti (numero 13 cifre) | (design, `TaxNotice`) | Guida operativa AdE "Servizio CIVIS" | 2026-09-19 |
| CPB non applicabile ai forfettari | (design) | D.Lgs. 81/2025 art. 7 | 2026-09-20 |

## Non verificato / aperto

Regola del progetto: ciò che è in questa lista **non è implementato come regola**; dove serve un valore, il software lo segnala come non verificato.

| Punto | Stato | Cosa serve |
|---|---|---|
| Prefisso "NC-" per la numerazione delle note di credito | Scelta di progetto, non una regola: la Spec. 1.9.1 ammette lo stesso numero tra TD01 e TD04 nello stesso anno; il DPR 633/72 art. 21 c. 2 lett. b) richiede solo un numero progressivo univoco | — |
| RiferimentoNormativo nel DatiRiepilogo ("Art. 1, commi 54-89, L. 190/2014"; "Art. 7-ter DPR 633/72") | Testo libero richiesto dalla Spec. quando Natura è valorizzata; la formulazione è una scelta di progetto | — |

