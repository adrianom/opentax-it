# Registro delle fonti ufficiali

Ogni documento ufficiale letto per scrivere una regola ha una voce in [registro.json](registro.json) e una copia in [documenti/](documenti/). Le citazioni nei set di regole (`sourceRefs` in `packages/fiscal-rules/src/rule-sets/`) puntano alla voce con `sourceId` e sono controllate dai test sul testo archiviato.

## La voce del registro

| Campo | Contenuto |
|---|---|
| `id` | Id stabile, es. `inps-circ-8-2026`, `normattiva-l-190-2014-art1` |
| `authority`, `title`, `kind` | Ente, titolo dell'atto, tipo (`law`, `circular`, `resolution`, `instructions`, `specification`, `guide`, `table`, `web-page`) |
| `url` | Indirizzo ufficiale da citare (quello nei `sourceRefs`) |
| `fetchUrl` | Da dove si scarica il contenuto, se diverso: il PDF di una circolare INPS, il singolo articolo in Gazzetta Ufficiale |
| `sessionUrl` | Pagina da aprire prima per il cookie di sessione (articoli della Gazzetta Ufficiale) |
| `format` | `pdf`, `html` o `xls` |
| `contentSelector` | Per le pagine HTML: il pezzo del tag che contiene il testo (es. `class="bodyTesto"` su Normattiva), così menu e piè di pagina non entrano nell'archivio |
| `file`, `text` | File archiviato e testo estratto. Per le pagine HTML si archivia solo il testo estratto |
| `retrievedOn`, `sha256` | Data di consultazione e impronta di `file` |

Le leggi si archiviano per articolo, come si leggono su Normattiva (testo vigente) o in Gazzetta Ufficiale (testo originario).

## Comandi

```sh
pnpm fonti archive <id> [<id>...]   # scarica, estrae il testo, aggiorna impronta e data
pnpm fonti check [<id>...]          # riscarica e segnala le fonti cambiate, senza scrivere nulla
```

Il testo dei PDF si estrae con `pdftotext` (poppler). Le tabelle XLS si archiviano così come sono; il testo (`.tsv`, un foglio per sezione, colonne separate da tabulazione) va rigenerato a mano quando il file cambia: quello attuale è stato prodotto con SheetJS 0.20.3 (`sheet_to_csv` con separatore tabulazione).

## Aggiungere una fonte

1. Aggiungi la voce in `registro.json` con `retrievedOn` e `sha256` vuoti, poi `pnpm fonti archive <id>`.
2. Controlla il testo archiviato: deve contenere l'atto, non la pagina del sito.
3. Nei `sourceRefs` usa `sourceId` e l'`url` della voce. La citazione è **testo esatto** del documento archiviato; più parti si separano con `...`. Note e riferimenti vanno nel `title`, non tra parentesi nella citazione. Se il valore si regge su più fonti, le altre vanno in `additional` con la loro citazione.
4. `pnpm --filter @opentax-it/fiscal-rules test`: il test confronta ogni parte della citazione con il testo archiviato, ignorando accenti, apostrofi, virgolette, trattini, a capo e i segni `((...))` con cui Normattiva marca le modifiche.

## Perché i documenti sono nel repository

Se un ente sposta un URL o aggiorna un PDF, resta la copia di ciò che è stato letto, con la sua impronta. Base legale: L. 633/1941 art. 5 (Normattiva, testo vigente): "Le disposizioni di questa legge non si applicano ai testi degli atti ufficiali dello stato e delle Amministrazioni pubbliche". Guide divulgative e modelli non sono atti ufficiali in senso stretto: da valutare caso per caso (vedi [TODO.md](../../TODO.md)).
