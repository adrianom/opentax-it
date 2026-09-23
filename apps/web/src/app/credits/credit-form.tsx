'use client';

import { useActionState, useState } from 'react';
import { saveTaxCredit } from '@/lib/actions';
import type { TaxCredit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { ErrorAlert } from '@/components/error-alert';
import { HelpTip } from '@/components/help-tip';
import { NativeSelect } from '@/components/native-select';

export function CreditForm({ credit, defaultYear }: { credit?: TaxCredit; defaultYear: number }) {
  const [state, action, pending] = useActionState(saveTaxCredit, undefined);
  const c = credit;
  const [section, setSection] = useState<string>(c?.section ?? 'TREASURY');
  const local = section === 'REGIONAL' || section === 'LOCAL';
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <ErrorAlert message={state?.error} />
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Sezione F24" htmlFor="section">
        <NativeSelect id="section" name="section" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="TREASURY">Erario</option>
          <option value="INPS">INPS</option>
          <option value="REGIONAL">Regioni</option>
          <option value="LOCAL">IMU e altri tributi locali</option>
        </NativeSelect>
      </Field>
      <Field label={section === 'INPS' ? 'Causale' : 'Codice tributo'} htmlFor="code" help={<HelpTip><p>Come risulta dalla dichiarazione: 4001 saldo IRPEF, 1792 imposta sostitutiva forfettari (LM47), 3844 addizionale comunale, 3801 addizionale regionale; PXX per il credito INPS Gestione Separata (RR8 col. 2, utilizzabile solo in F24 con l&apos;anno di riferimento). Istr. Redditi PF 2026, Fasc. 1 &quot;Principali codici tributo&quot;.</p></HelpTip>}>
        <Input id="code" name="code" required placeholder={section === 'INPS' ? 'PXX' : '4001'} defaultValue={c?.code ?? ''} />
      </Field>
      <Field label="Anno di riferimento" htmlFor="referenceYear"><Input id="referenceYear" name="referenceYear" type="number" required defaultValue={c?.referenceYear ?? defaultYear} /></Field>
      <Field label="Importo" htmlFor="amount"><Input id="amount" name="amount" type="number" step="0.01" min="0.01" required defaultValue={c ? Number(c.amount) : undefined} /></Field>
      {local && (
        <Field label={section === 'REGIONAL' ? 'Codice regione' : 'Codice ente / comune'} htmlFor="localCode" help={<HelpTip><p>Codice catastale del comune (es. D567) per l&apos;addizionale comunale; codice regione per l&apos;addizionale regionale (tabelle T0/T4 sul sito AdE).</p></HelpTip>}>
          <Input id="localCode" name="localCode" required maxLength={4} defaultValue={c?.localCode ?? ''} />
        </Field>
      )}
      {section !== 'INPS' && (
        <Field label="Rateazione (colonna F24)" htmlFor="installmentCode" hint="0101 nei modelli visti"><Input id="installmentCode" name="installmentCode" defaultValue={c ? (c.installmentCode ?? '') : '0101'} pattern="\d{4}" /></Field>
      )}
      <Field label="Utilizzabile dal" htmlFor="usableFrom" help={<HelpTip><p>Sopra 5.000 € annui il credito è utilizzabile dal decimo giorno successivo alla presentazione della dichiarazione, con visto di conformità (art. 3 D.Lgs. 33/2025; L. 147/2013 art. 1 c. 574). Campo informativo.</p></HelpTip>}>
        <Input id="usableFrom" name="usableFrom" type="date" defaultValue={c?.usableFrom?.slice(0, 10) ?? ''} />
      </Field>
      <Field label="Descrizione" htmlFor="description"><Input id="description" name="description" placeholder="Credito IRPEF da Redditi 2026" defaultValue={c?.description ?? ''} /></Field>
      <div className="sm:col-span-3"><Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : c ? 'Salva modifiche' : 'Aggiungi credito'}</Button></div>
    </form>
  );
}
