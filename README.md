# OpenTax IT

Gestionale **open source** (`opentax-it`) per partite IVA italiane in **regime forfettario** (L. 190/2014, art. 1 c. 54-89):

- fatture e note di credito in formato **FatturaPA** (XML), invio allo **SDI via PEC** (nessun provider a pagamento, nessun accreditamento);
- **principio di cassa**: emesso vs incassato, reddito imponibile calcolato sugli incassi dell'anno;
- **scadenzario**: saldo, acconti (40/60), rate mensili fino al 16 dicembre, INPS Gestione Separata, imposta di bollo trimestrale;
- **libro mastro crediti/compensazioni** (credito da dichiarazione → F24 che lo usano → residuo);
- preparazione F24 per rata, pensati per l'addebito a date future (**I24**) da inviare con F24 web;
- registro degli **avvisi/comunicazioni** (CIVIS) e delle relative rate;
- **regole fiscali versionate per anno** (`FiscalRuleSet`): niente valori hardcodati; un job controlla periodicamente le fonti ufficiali (AdE, INPS, GU/Normattiva, ADM) e propone le modifiche all'amministratore, che le attiva esplicitamente;
- schema **multi-tenant** fin dall'inizio.

> **Avvertenza.** Questo software è uno strumento di supporto al calcolo e all'organizzazione: **non è consulenza fiscale** e non sostituisce un professionista abilitato. Le regole fiscali cambiano ogni anno; verifica sempre i valori attivi con le fonti ufficiali. Gli autori non rispondono di errori di calcolo, sanzioni o omissioni derivanti dall'uso del software (vedi [LICENSE](LICENSE), sez. 15-16).

## Stato

Fase iniziale: schema dati e regole fiscali. Le fonti normative verificate (aggiornate al 2026) sono in [docs/normativa-2026.md](docs/normativa-2026.md); il design del monitoraggio normativo in [docs/monitoraggio-normativo.md](docs/monitoraggio-normativo.md).

## Struttura

```
apps/api       NestJS + Prisma (PostgreSQL)
apps/web       React + Vite
packages/fiscal-rules   regole fiscali pure (TypeScript), testate, con riferimento normativo
docs/          normativa, design
```

## Avvio rapido

Requisiti: Node ≥ 22, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up          # PostgreSQL in Docker
pnpm db:migrate     # schema Prisma
pnpm dev            # api + web
```

## Contribuire

Leggi [CONTRIBUTING.md](CONTRIBUTING.md). Ogni regola fiscale deve citare la fonte ufficiale (norma, provvedimento, circolare) nel codice e nei test.

## Licenza

[AGPL-3.0-only](LICENSE). Se modifichi il software e lo offri come servizio in rete, devi rendere disponibile il codice sorgente modificato agli utenti del servizio.
