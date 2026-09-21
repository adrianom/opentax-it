# Sicurezza

Il software gestisce dati fiscali e credenziali (PEC, IBAN). Se trovi una vulnerabilità **non aprire una issue pubblica**: contatta il maintainer in privato tramite il profilo GitHub del repository. Riceverai risposta entro 7 giorni.

Linee guida di progetto:
- credenziali dei tenant cifrate a riposo (`APP_ENCRYPTION_KEY`);
- isolamento per tenant applicato a livello di query;
- nessun dato reale nei test o nei fixture.
