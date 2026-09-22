'use client';

import { useActionState, useState } from 'react';
import { saveCustomer } from '@/lib/actions';
import type { Customer, CustomerKind } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/field';
import { HelpTip } from '@/components/help-tip';
import { NativeSelect } from '@/components/native-select';
import { ErrorAlert } from '@/components/error-alert';

const KINDS: Array<[CustomerKind, string]> = [
  ['IT_B2B', 'Italia — azienda / professionista (B2B)'],
  ['IT_B2C', 'Italia — privato (B2C)'],
  ['IT_PA', 'Italia — pubblica amministrazione'],
  ['EU', 'Unione Europea — soggetto passivo'],
  ['NON_EU', 'Extra UE'],
];

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [state, action, pending] = useActionState(saveCustomer, undefined);
  const [kind, setKind] = useState<CustomerKind>(customer?.kind ?? 'IT_B2B');
  const foreign = kind === 'EU' || kind === 'NON_EU';
  const c = customer;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <ErrorAlert message={state?.error} />
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Tipo cliente" htmlFor="kind" hint={foreign ? 'Fattura senza IVA ex art. 7-ter, Natura N2.1, codice destinatario XXXXXXX' : 'Natura N2.2, diciture regime forfettario'}>
        <NativeSelect id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as CustomerKind)}>
          {KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Denominazione" htmlFor="businessName" hint="Oppure nome e cognome"><Input id="businessName" name="businessName" defaultValue={c?.businessName ?? ''} /></Field>
      <Field label="Nome" htmlFor="firstName"><Input id="firstName" name="firstName" defaultValue={c?.firstName ?? ''} /></Field>
      <Field label="Cognome" htmlFor="lastName"><Input id="lastName" name="lastName" defaultValue={c?.lastName ?? ''} /></Field>
      {foreign && (
        <Field label="Paese (ISO)" htmlFor="countryCode" hint="Es. DE, FR, US"><Input id="countryCode" name="countryCode" defaultValue={c?.countryCode ?? ''} maxLength={2} required /></Field>
      )}
      <Field label={foreign ? 'Partita IVA / VAT id (senza prefisso paese)' : 'Partita IVA'} htmlFor="vatNumber"><Input id="vatNumber" name="vatNumber" defaultValue={c?.vatNumber ?? ''} /></Field>
      {!foreign && <Field label="Codice fiscale" htmlFor="fiscalCode"><Input id="fiscalCode" name="fiscalCode" defaultValue={c?.fiscalCode ?? ''} /></Field>}
      <Field label="Indirizzo" htmlFor="address"><Input id="address" name="address" defaultValue={c?.address ?? ''} required /></Field>
      <Field label="CAP" htmlFor="postalCode" hint={foreign ? 'Per l\'estero viene usato 00000' : undefined}><Input id="postalCode" name="postalCode" defaultValue={c?.postalCode ?? ''} /></Field>
      <Field label="Comune / città" htmlFor="city"><Input id="city" name="city" defaultValue={c?.city ?? ''} required /></Field>
      {!foreign && <Field label="Provincia" htmlFor="province"><Input id="province" name="province" defaultValue={c?.province ?? ''} maxLength={2} /></Field>}
      {!foreign && (
        <>
          <Field
            label="Codice destinatario SDI"
            htmlFor="recipientCode"
            hint={kind === 'IT_PA' ? 'Codice IPA a 6 caratteri (obbligatorio)' : '7 caratteri; lascia vuoto per 0000000 (PEC o cassetto fiscale)'}
            help={
              <HelpTip label="Codice destinatario o PEC?">
                <p>Nessuno dei due è obbligatorio per il cliente: il campo CodiceDestinatario c&apos;è sempre e vale <code>0000000</code> quando non si conosce il canale. Lo SDI recapita così (Specifiche tecniche 1.9.1 §1.5.5): 1) se il cliente ha registrato un indirizzo telematico nel portale Fatture e Corrispettivi, usa quello, qualunque cosa ci sia in fattura; 2) altrimenti, se c&apos;è un codice destinatario valido, usa quel canale; 3) altrimenti, con <code>0000000</code> e PEC indicata, invia alla PEC; 4) con <code>0000000</code> e nessuna PEC, mette la fattura nell&apos;area riservata del cliente.</p>
                <p>Puoi inserire entrambi: con un codice valido la PEC non viene usata dallo SDI.</p>
              </HelpTip>
            }
          >
            <Input id="recipientCode" name="recipientCode" defaultValue={c?.recipientCode === '0000000' ? '' : (c?.recipientCode ?? '')} />
          </Field>
          <Field label="PEC destinatario" htmlFor="recipientPec" hint="Usata dallo SDI solo con codice 0000000"><Input id="recipientPec" name="recipientPec" type="email" defaultValue={c?.recipientPec ?? ''} /></Field>
        </>
      )}
      <Field label="Valuta" htmlFor="currency"><Input id="currency" name="currency" defaultValue={c?.currency ?? 'EUR'} maxLength={3} /></Field>
      <div className="sm:col-span-2"><Field label="Note" htmlFor="notes"><Textarea id="notes" name="notes" defaultValue={c?.notes ?? ''} /></Field></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Salva'}</Button></div>
    </form>
  );
}
