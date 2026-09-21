'use client';

import { useActionState } from 'react';
import { createTenant } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { ErrorAlert } from '@/components/error-alert';

export function TenantForm() {
  const [state, action, pending] = useActionState(createTenant, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <ErrorAlert message={state?.error} />
      <Field label="Nome (interno)" htmlFor="name"><Input id="name" name="name" required /></Field>
      <Field label="Denominazione (opzionale)" htmlFor="businessName"><Input id="businessName" name="businessName" /></Field>
      <Field label="Nome" htmlFor="firstName"><Input id="firstName" name="firstName" required /></Field>
      <Field label="Cognome" htmlFor="lastName"><Input id="lastName" name="lastName" required /></Field>
      <Field label="Codice fiscale" htmlFor="fiscalCode"><Input id="fiscalCode" name="fiscalCode" required minLength={16} maxLength={16} /></Field>
      <Field label="Partita IVA" htmlFor="vatNumber"><Input id="vatNumber" name="vatNumber" required pattern="\d{11}" /></Field>
      <Field label="Codice ATECO (2007)" htmlFor="atecoCode" hint="Es. 62.02 — determina il coefficiente di redditività"><Input id="atecoCode" name="atecoCode" required placeholder="62.02" /></Field>
      <Field label="Anno inizio attività" htmlFor="activityStartYear" hint="Per l'aliquota 5% (primi 5 anni)"><Input id="activityStartYear" name="activityStartYear" type="number" required min={1990} /></Field>
      <Field label="Indirizzo" htmlFor="address"><Input id="address" name="address" required /></Field>
      <Field label="CAP" htmlFor="postalCode"><Input id="postalCode" name="postalCode" required pattern="\d{5}" /></Field>
      <Field label="Comune" htmlFor="city"><Input id="city" name="city" required /></Field>
      <Field label="Provincia" htmlFor="province"><Input id="province" name="province" required minLength={2} maxLength={2} /></Field>
      <Field label="PEC (per l'invio allo SDI)" htmlFor="pecAddress"><Input id="pecAddress" name="pecAddress" type="email" /></Field>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm"><Checkbox name="reducedRate" /> Aliquota ridotta 5% (requisiti art. 1 c. 65 L. 190/2014)</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox name="applyInpsSurcharge" /> Applica rivalsa INPS 4% in fattura</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox name="viesRegistered" /> Iscritto al VIES</label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Crea'}</Button>
      </div>
    </form>
  );
}
