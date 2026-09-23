# TODO — cosa manca e cosa è aperto

Elenco per la community di ciò che non è ancora fatto, per epiche. Prima di prendere un punto leggi [CONTRIBUTING.md](CONTRIBUTING.md): si lavora solo su fonti ufficiali verificate, con esempi ufficiali, senza assunzioni. Ogni epica indica le fonti da cui partire; se una fonte non è ancora stata letta, il punto è marcato **da verificare**.

Stato aggiornato al 23/09/2026. Cosa è già fatto e con quale riferimento normativo: [docs/compliance.md](docs/compliance.md).

## Priorità alta

### Autenticazione e permessi
Oggi la partita IVA attiva è scelta in `/setup` e salvata in un cookie; l'API riceve il tenant da un header. **Obbligatoria prima di qualsiasi uso fuori dal proprio computer.**
- Login (email + password o passkey), sessioni, ruoli già previsti nello schema (`UserRole`), tenant multipli per utente.
- L'header `x-tenant-id` e il cookie `opentax_tenant` vanno sostituiti dalla sessione.
- Rate limiting e audit log (`AuditLog` esiste nello schema, non è usato).

### Invio allo SDI via PEC e ricevute
Emissione e XML sono pronti; manca la trasmissione.
- Invio del file a `sdi01@pec.fatturapa.it` e poi all'indirizzo PEC assegnato dallo SDI (Specifiche tecniche 1.9.1 §1.5 "servizio PEC"); lettura delle ricevute RC/NS/MC/DT e aggiornamento di `SdiTransmission`/`SdiNotification`.
- Conservazione: le fatture emesse vanno conservate (DPR 633/72 art. 39; DM 17/06/2014): valutare l'adesione al servizio di conservazione gratuito dell'AdE (Fatture e Corrispettivi) come indicazione all'utente.

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

## Piattaforma

### MCP server per assistenti AI
- Esporre lettura (scadenze, riepilogo imposte, fatture) e azioni sicure (bozza fattura, registrazione incasso) come strumenti MCP, con permessi per tenant. Dipende dall'autenticazione.

### Qualità
- Test e2e dell'API (oggi c'è un solo test), test dei componenti web.
- Dipendenze: l'audit segnala vulnerabilità solo in dipendenze transitive del CLI Prisma (`mysql2`, `deepmerge-ts`), non usate a runtime con PostgreSQL; da rivalutare a ogni aggiornamento di Prisma.
- Deploy: immagine Docker per api + web, backup del database e della cartella `storage/`.

### Roadmap su GitHub
- Portare le epiche di questo file in **Issues** (una per epica, etichette per area, priorità e "da verificare") e in un **Project** board del repository, così che la community possa prenderle in carico; questo file resta l'indice. Richiede accesso al repo con `gh auth login` (o token) da parte di un maintainer.

## Punti aperti verificabili
Elencati con la fonte che manca in [docs/compliance.md](docs/compliance.md), sezione "Non verificato / aperto" (es. contributo INPS al centesimo vs quadro RR in euro interi; abbinamento ATECO → ISA; Istr. Redditi PF 2025 non lette per il set 2025).
