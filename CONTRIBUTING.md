# Contribuire

Grazie per l'interesse. Contribuendo accetti che il software è distribuito senza garanzia e senza alcuna assunzione di responsabilità da parte di autori e contributori ([DISCLAIMER.md](DISCLAIMER.md), AGPL-3.0 sez. 15-16): il progetto non fornisce consulenza fiscale.

Alcune regole che rendono il progetto affidabile:

## Regole fiscali
- **Solo fonti ufficiali**: Agenzia delle Entrate, INPS, Gazzetta Ufficiale/Normattiva, ADM, fatturapa.gov.it. Blog e portali fiscali possono orientare, ma non sono una fonte accettabile in una PR.
- Ogni regola in `packages/fiscal-rules` deve avere: riferimento normativo in commento (atto, articolo/comma o provvedimento, data), test con casi presi dagli esempi ufficiali (es. il prospetto rate delle istruzioni Redditi PF), e un'entry in `docs/normativa-*.md`.
- Nessun valore hardcodato nel codice applicativo: aliquote, soglie, scadenze vivono nel `FiscalRuleSet` dell'anno.
- Se una fonte è ambigua, apri una issue prima di codificare.

## Codice
- TypeScript strict, lint (`pnpm lint`) e test (`pnpm test`) verdi.
- Commit piccoli con messaggio che spiega il *perché*.
- Niente dati reali (P.IVA, IBAN, fatture) negli esempi e nei test: usa dati fittizi.
- Segreti mai nel repo: usa `.env` (ignorato) e `.env.example`.

## Segnalazioni
- Errori di calcolo o normativi: issue con etichetta `fiscal`, indicando la fonte ufficiale che contraddice il comportamento.
- Vulnerabilità: vedi [SECURITY.md](SECURITY.md).
