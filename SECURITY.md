# Sicurezza

Il software gestisce dati fiscali e credenziali (PEC, IBAN). Se trovi una vulnerabilità **non aprire una issue pubblica**: contatta il maintainer in privato tramite il profilo GitHub del repository. Riceverai risposta entro 7 giorni.

Stato attuale (fase iniziale):
- **nessuna autenticazione**: API, web e database ascoltano solo su `127.0.0.1` e rifiutano host non consentiti (DNS rebinding); non esporli in rete finché il login non è pronto ([TODO.md](TODO.md));
- **nessuna cifratura a riposo**: i dati (IBAN, codici fiscali, fatture) sono in chiaro nel database e nella cartella `storage/`. `APP_ENCRYPTION_KEY` è riservata alla cifratura dei segreti, da implementare prima di salvare credenziali PEC/SDI;
- le richieste che modificano dati devono essere JSON: un sito esterno non può inviarle senza il permesso del CORS (protezione CSRF).

Linee guida di progetto:
- isolamento per tenant applicato a livello di query;
- nessun dato reale nei test o nei fixture.
