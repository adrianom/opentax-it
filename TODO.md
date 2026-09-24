# TODO — cosa manca e cosa è aperto

Elenco per la community di ciò che non è ancora fatto, per epiche. Prima di prendere un punto leggi [CONTRIBUTING.md](CONTRIBUTING.md): si lavora solo su fonti ufficiali verificate, con esempi ufficiali, senza assunzioni. Ogni epica indica le fonti da cui partire; se una fonte non è ancora stata letta, il punto è marcato **da verificare**.

Stato aggiornato al 23/09/2026. Cosa è già fatto e con quale riferimento normativo: [docs/compliance.md](docs/compliance.md).

## Priorità alta

### Conformità (review del 23/09/2026)
Esito della review dell'intero codice contro le fonti ufficiali; fonti e citazioni in [docs/normativa-2026.md](docs/normativa-2026.md) §5-ter. In ordine di priorità:
1. ~~**Maggiorazione INPS nella riga DPPI**~~ fatto il 24/09/2026 — (differimento 0,40%/0,80%): oggi è sommata al contributo PXX/PXXR in `f24-schedule.ts`; per l'INPS va versata con DPPI insieme agli interessi (Circ. INPS 62/2026 §3-4). Per l'Erario resta dentro il tributo (Fasc. 1 §7). Test INPS con differimento.
2. ~~**Escludere le maggiorazioni**~~ fatto il 24/09/2026 (per gli F24 generati da ora in poi) — dagli acconti e contributi ripresi in dichiarazione (LM45, RR5 col. 16, LM35) in `taxes.service.ts` → `paidFromF24` (Fasc. 3 LM45: "non devono essere considerate le maggiorazioni").
3. ~~**Festività e date**~~ fatto il 24/09/2026 (set 2026 v4 da attivare in Impostazioni) —: 4 ottobre festa nazionale dal 2026 (L. 151/2025) in `calendar.ts`, con la data di inizio validità; proroga 2026 con +0,80% al **20/8** (non 19/8) nel set di regole 2026 (seconda rata 0,30%).
4. ~~**Base e saldo INPS in euro interi**~~ fatto il 24/09/2026 —: base = LM34 arrotondato (Circ. INPS 62/2026 §2.2), contributo RR5 col. 15 e saldo in euro interi, acconti al 40% al centesimo.
5. **Soglie 85.000 / 100.000 €** (L. 190/2014 c. 54 e 71): badge di avvicinamento in dashboard e in emissione (es. dall'80% di ciascuna soglia, sugli incassi dell'anno più il totale della fattura); sopra 85.000 € avviso che il regime cessa dall'anno successivo; sopra 100.000 € avviso bloccante all'emissione (il regime cessa dall'anno stesso e l'IVA è dovuta dalla fattura che fa superare la soglia) e niente calcolo forfettario né piano F24 per quell'anno. **Limite personale configurabile** nel profilo: cifra oltre la quale l'emissione viene bloccata (es. per restare sotto 85.000 €), con conferma esplicita per superarlo.
6. **Clienti esteri azienda o privato**: UE privato → N2.2 senza "inversione contabile", INVCONT né Intrastat (art. 7-ter c. 1 lett. b); extra UE privato → N2.1 solo per i servizi dell'art. 7-septies.
7. **Fatture in valuta**: cambio del giorno dell'incasso (TUIR art. 9 c. 2), obbligatorio all'incasso se la valuta non è EUR; niente emissione in valuta senza cambio; soglia del bollo sul controvalore in EUR (fonte per i 2 € nel totale in valuta **da verificare**).
8. **Fatture alla PA**: CodiceDestinatario di 6 caratteri con FPA12 (errore 00427); dati obbligatori FPA **da verificare**.
9. **Maggiorazione anche sui debiti compensati** con partenza differita (Fasc. 1 §7, inferenza dalla regola generale: **da verificare**).
10. **Crediti**: non proporre in F24 i crediti con `usableFrom` successivo alla data del modello; soglia 5.000 € per tipo di credito e anno.
11. **Nome file SDI univoco**: controllare il progressivo contro tutti i file già trasmessi, anche importati o inviati con altri software (errore 00002); progressivo iniziale configurabile.
12. **Bollo per data di consegna**: il trimestre dipende dalla data della ricevuta di consegna SDI (Guida AdE bollo giugno 2026); fino all'invio SDI il conteggio è una stima e va dichiarato.
13. Minori: suggerimento "12 giorni" nel form fattura da adattare per le fatture estere (15 del mese successivo, art. 21 c. 4 lett. c-d); blocco fatture UE B2B senza iscrizione VIES (**da verificare**, art. 35 DPR 633/72); base della soglia del bollo con la rivalsa INPS (**da verificare**); rateazione avvisi bonari da rivedere per il set 2027 (art. 3-bis D.Lgs. 462/97 cambia dal 2027).

### Sicurezza di base (prima dell'autenticazione)
Finché non c'è il login, l'applicazione va usata **solo in locale**: chi raggiunge l'API può leggere e modificare i dati di qualunque partita IVA (OWASP A01). Esito della security review del 23/09/2026 (intero codebase, OWASP Top 10; `pnpm audit` senza vulnerabilità note; parser e builder XML verificati contro XXE, billion laughs e prototype pollution).
- Fatto: API, web e Postgres su `127.0.0.1`; allowlist dell'header Host contro il DNS rebinding (`ALLOWED_HOSTS`); password di Postgres da `.env`; richieste che modificano dati solo JSON (CSRF); id codificati negli URL verso l'API; set di regole attivabili solo da bozza/proposta; import XML con nomi univoci e senza sovrascrittura; SECURITY.md allineato allo stato reale; lock per tenant nell'emissione (`pg_advisory_xact_lock`) contro numeri e nomi file duplicati con emissioni concorrenti.
- Fatto (sforzo piccolo): helmet nell'API e header anti-clickjacking/`nosniff` nel web; body JSON limitato a 1 MB tranne l'import XML; nomi file sicuri nei download e `Numero` validato all'import (String20Type); errori imprevisti non esposti; limiti nei DTO (importi, righe, giorni, note, PEC); modello F24 rifiutato se lo SHA-256 non coincide (`F24_MODEL_ALLOW_UNVERIFIED=true` per forzare); storage con permessi `0700`/`0600` e percorsi confinati nella cartella; cookie `opentax_tenant` `httpOnly` con id validato; CI con `permissions: contents: read`; `NEXT_PUBLIC_API_URL` rinominata `API_URL`.
- Da fare:
  - errori in `/f24` e `/credits` passati come codice invece che come testo nell'URL (rischio basso: React fa l'escape e l'app è solo locale);
  - `updateMany`/`deleteMany` con `tenantId` o un'estensione Prisma che lo inietti, come difesa in profondità per quando ci sarà l'autenticazione.

### Autenticazione e permessi
Oggi la partita IVA attiva è scelta in `/setup` e salvata in un cookie; l'API riceve il tenant da un header. **Obbligatoria prima di qualsiasi uso fuori dal proprio computer.**
- Login (email + password o passkey), sessioni, ruoli già previsti nello schema (`UserRole`), tenant multipli per utente.
- L'header `x-tenant-id` e il cookie `opentax_tenant` vanno sostituiti dalla sessione.
- Rate limiting e audit log (`AuditLog` esiste nello schema, non è usato).

### Invio allo SDI via PEC e ricevute
Emissione e XML sono pronti; manca la trasmissione.
- Invio del file a `sdi01@pec.fatturapa.it` e poi all'indirizzo PEC assegnato dallo SDI (Specifiche tecniche 1.9.1 §1.5 "servizio PEC"); lettura delle ricevute RC/NS/MC/DT e aggiornamento di `SdiTransmission`/`SdiNotification`.
- Conservazione: le fatture emesse vanno conservate a norma (DPR 633/72 art. 39; DM 17/06/2014). Fatto: avviso nel README con l'indicazione del servizio gratuito dell'AdE (Fatture e Corrispettivi). Da fare: storico delle fatture nell'applicazione e promemoria di adesione nella pagina di setup.

### Dichiarazione dei redditi: prospetto LM/RR
- Produrre il prospetto dei righi LM (sez. III) e RR (sez. II) con i valori calcolati, per il contribuente o il suo intermediario; segnare la dichiarazione come presentata (`TaxReturn`) e registrare i crediti risultanti (LM47, RR8) nel modulo Crediti.
- Fonti: Istr. Redditi PF 2026 Fasc. 1, 2 (RR) e 3 (LM).

## Fatturazione

### Anteprima e stampa della fattura
- Fatto: copia di cortesia in PDF con layout proprio, aperta in una nuova scheda (anteprima, stampa e download dal browser); per le fatture emesse i dati sono letti dall'XML salvato (PR #10).
- Da fare: invio della fattura via email al cliente (copia di cortesia: l'originale è l'XML consegnato dallo SDI).

### Fatture con firma digitale (.p7m) — priorità bassa
- Non prioritaria: serve solo quando è richiesta (caso reale: fatturazione verso una pubblica amministrazione). **Da verificare** sulle Specifiche tecniche 1.9.1 e su fatturapa.gov.it quali casi la richiedono; poi firma CAdES-BES (`.xml.p7m`) con certificato dell'utente.

### Template di fattura
- Righe ricorrenti, descrizioni e note salvate come modelli; duplicazione di una fattura esistente.

### Import da altri strumenti
- Fatto: import di XML FatturaPA emessi altrove (numero originale, XML conservato).
- Da fare: import massivo dallo zip scaricato dal portale AdE "Fatture e Corrispettivi" (emesse e ricevute), con riconciliazione degli incassi.
- OCR per fatture cartacee/PDF: bassa priorità (dal 2019 ogni fattura emessa esiste come XML; l'OCR servirebbe solo per documenti precedenti o per fatture ricevute da soggetti esclusi).

### Fatture ricevute (acquisti)
- Le fatture ricevute non incidono sul reddito forfettario ma servono per il registro e per l'IVA sugli acquisti esteri (L. 190/2014 c. 60: versamento entro il 16 del mese successivo). Import dallo SDI e scadenza in calendario.

## Versamenti

### F24 e rate — completamenti
- Fatto: piano rate, unica soluzione (1 rata → `0101`), interessi, I24, stampa sul modello ufficiale, compensazione a saldo zero, collegamento F24 pagati → Imposte.
- Da fare: F24 per il bollo trimestrale (codici 2521-2524, scadenze già in calendario); ravvedimento operoso (D.Lgs. 472/97 art. 13; D.Lgs. 471/97 art. 13) con codici 8944/1989/1990 — **da verificare**; export dei dati per F24 web/home banking (formato **da verificare**: non esiste un tracciato pubblico per il contribuente, solo per intermediari).
- Set di regole 2027 quando usciranno circolare INPS, istruzioni e proroghe.
- Messaggi di avviso dell'API in italiano (oggi in inglese).

### Monitoraggio normativo
- Job periodico che controlla le fonti registrate (`RuleSource`) e propone un `RuleChangeProposal` all'admin, senza mai attivare nulla da solo. Design in [docs/monitoraggio-normativo.md](docs/monitoraggio-normativo.md).

### Avvisi bonari e CIVIS
- Registro delle comunicazioni (numero atto a 13 cifre), scadenze a 60 giorni, sanzione ridotta a 1/3, piano fino a 20 rate (D.Lgs. 462/97 art. 2-3-bis), collegamento agli F24 con codice atto. Design in `docs/normativa-2026.md` §5-bis.

## Analisi

### Pagina Analytics — contenuti da definire
Una pagina di analisi dei dati già presenti (fatture, incassi, imposte, F24), separata dalla dashboard che resta un riepilogo dell'anno. **Cosa mostrare è ancora da decidere**: le voci qui sotto sono proposte da valutare, non lavoro già definito. Le grandezze fiscali (reddito, imposte, soglia) vanno calcolate con le stesse regole di `/taxes`, senza formule nuove non verificate.
- Incassato ed emesso per mese, con confronto con l'anno precedente.
- Andamento dell'incassato rispetto alla soglia degli 85.000 € (L. 190/2014 c. 54) e proiezione a fine anno sul ritmo attuale, dichiarata come stima.
- Ripartizione per cliente (concentrazione del fatturato) e per tipo di cliente (Italia, UE, extra UE).
- Tempi di incasso: giorni medi tra data fattura e incasso; fatture scadute non incassate.
- Quanto accantonare: imposta sostitutiva e INPS stimate sull'incassato dell'anno, rispetto a quanto già versato con gli F24.
- Calendario di cassa: uscite previste (rate F24, bollo) nei prossimi mesi.

## Piattaforma

### MCP server per assistenti AI
- Esporre lettura (scadenze, riepilogo imposte, fatture) e azioni sicure (bozza fattura, registrazione incasso) come strumenti MCP, con permessi per tenant. Dipende dall'autenticazione.

### Qualità
- Test e2e dell'API su database reale (oggi c'è un solo test, e `test/app.e2e-spec.ts` non compila con `tsc`: mancano i tipi di `supertest/types`), in particolare: più bozze dello stesso anno e tipo, emissioni concorrenti con il lock per tenant, import con nomi file uguali; test dei componenti web.
- Dipendenze: l'audit segnala vulnerabilità solo in dipendenze transitive del CLI Prisma (`mysql2`, `deepmerge-ts`), non usate a runtime con PostgreSQL; da rivalutare a ogni aggiornamento di Prisma.
- Deploy: immagine Docker per api + web, backup del database e della cartella `storage/`.

### Roadmap su GitHub
- Portare le epiche di questo file in **Issues** (una per epica, etichette per area, priorità e "da verificare") e in un **Project** board del repository, così che la community possa prenderle in carico; questo file resta l'indice. Richiede accesso al repo con `gh auth login` (o token) da parte di un maintainer.

## Punti aperti verificabili
Elencati con la fonte che manca in [docs/compliance.md](docs/compliance.md), sezione "Non verificato / aperto" (es. contributo INPS al centesimo vs quadro RR in euro interi; abbinamento ATECO → ISA; Istr. Redditi PF 2025 non lette per il set 2025).
