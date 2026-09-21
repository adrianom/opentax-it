'use client';

import { useActionState } from 'react';
import { issueInvoice } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { ErrorAlert } from '@/components/error-alert';

export function IssueForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(issueInvoice, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorAlert message={state?.error} />
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Scadenza pagamento (opzionale)" htmlFor="dueDate"><Input id="dueDate" name="dueDate" type="date" /></Field>
        <Field label="IBAN (opzionale)" htmlFor="iban"><Input id="iban" name="iban" /></Field>
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Emissione…' : 'Emetti fattura'}</Button>
    </form>
  );
}
