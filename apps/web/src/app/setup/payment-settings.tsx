'use client';

import { useActionState } from 'react';
import { deleteBankAccount, deletePaymentTerms, saveBankAccount, savePaymentTerms } from '@/lib/actions';
import type { BankAccount, PaymentTerms } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Field } from '@/components/field';
import { NativeSelect } from '@/components/native-select';
import { ErrorAlert } from '@/components/error-alert';

export function BankAccounts({ accounts }: { accounts: BankAccount[] }) {
  const [state, action, pending] = useActionState(saveBankAccount, undefined);
  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Banca</TableHead><TableHead>IBAN</TableHead><TableHead>BIC</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {accounts.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.name} {b.isDefault && <Badge variant="secondary">predefinita</Badge>}</TableCell>
                <TableCell>{b.bankName ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">{b.iban}</TableCell>
                <TableCell className="font-mono text-xs">{b.bic ?? '—'}</TableCell>
                <TableCell className="text-right"><form action={deleteBankAccount}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="sm" type="submit">Elimina</Button></form></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <form action={action} className="grid gap-3 sm:grid-cols-5">
        <ErrorAlert message={state?.error} />
        <Field label="Nome" htmlFor="bank-name"><Input id="bank-name" name="name" required placeholder="Conto principale" /></Field>
        <Field label="Banca" htmlFor="bank-bankName"><Input id="bank-bankName" name="bankName" /></Field>
        <Field label="IBAN" htmlFor="bank-iban"><Input id="bank-iban" name="iban" required /></Field>
        <Field label="BIC" htmlFor="bank-bic"><Input id="bank-bic" name="bic" /></Field>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox name="isDefault" defaultChecked={accounts.length === 0} /> Predefinita</label>
          <Button type="submit" disabled={pending}>Aggiungi banca</Button>
        </div>
      </form>
    </div>
  );
}

export function PaymentTermsList({ terms }: { terms: PaymentTerms[] }) {
  const [state, action, pending] = useActionState(savePaymentTerms, undefined);
  return (
    <div className="space-y-4">
      {terms.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Scadenza</TableHead><TableHead>Modalità</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name} {t.isDefault && <Badge variant="secondary">predefinito</Badge>}</TableCell>
                <TableCell>{t.days} giorni dalla data fattura</TableCell>
                <TableCell className="font-mono">{t.method}</TableCell>
                <TableCell className="text-right"><form action={deletePaymentTerms}><input type="hidden" name="id" value={t.id} /><Button variant="ghost" size="sm" type="submit">Elimina</Button></form></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <form action={action} className="grid gap-3 sm:grid-cols-4">
        <ErrorAlert message={state?.error} />
        <Field label="Nome" htmlFor="terms-name"><Input id="terms-name" name="name" required placeholder="Bonifico 10 gg d.f." /></Field>
        <Field label="Giorni dalla data fattura" htmlFor="terms-days"><Input id="terms-days" name="days" type="number" min={0} required defaultValue={10} /></Field>
        <Field label="Modalità (ModalitaPagamento)" htmlFor="terms-method">
          <NativeSelect id="terms-method" name="method" defaultValue="MP05">
            <option value="MP05">MP05 · Bonifico</option>
            <option value="MP08">MP08 · Carta di pagamento</option>
            <option value="MP19">MP19 · SEPA Direct Debit</option>
            <option value="MP01">MP01 · Contanti</option>
          </NativeSelect>
        </Field>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox name="isDefault" defaultChecked={terms.length === 0} /> Predefinito</label>
          <Button type="submit" disabled={pending}>Aggiungi profilo</Button>
        </div>
      </form>
    </div>
  );
}
