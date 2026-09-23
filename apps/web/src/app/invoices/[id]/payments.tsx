'use client';

import { useActionState } from 'react';
import { addPayment, deletePayment } from '@/lib/actions';
import { formatDate, formatMoney } from '@/lib/format';
import type { Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Field } from '@/components/field';
import { ErrorAlert } from '@/components/error-alert';

export function Payments({ invoiceId, currency, total, payments }: { invoiceId: string; currency: string; total: number; payments: Payment[] }) {
  const [state, action, pending] = useActionState(addPayment, undefined);
  const collected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Math.round((total - collected) * 100) / 100;
  return (
    <div className="space-y-4">
      <dl className="grid max-w-sm grid-cols-2 gap-1 text-sm">
        <dt className="text-muted-foreground">Incassato</dt><dd className="text-right font-mono">{formatMoney(collected, currency)}</dd>
        <dt className="text-muted-foreground">Residuo</dt><dd className="text-right font-mono">{formatMoney(outstanding, currency)}</dd>
      </dl>
      {payments.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead className="text-right">Importo</TableHead><TableHead>Metodo</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{formatDate(p.date)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(p.amount, currency)}</TableCell>
                <TableCell>{p.method ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <form action={deletePayment}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="invoiceId" value={invoiceId} /><Button variant="destructive" size="sm" type="submit">Elimina</Button></form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <form action={action} className="grid gap-3 sm:grid-cols-4">
        <ErrorAlert message={state?.error} />
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <Field label="Data incasso" htmlFor="date"><Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label={`Importo (${currency})`} htmlFor="amount" hint="Negativo per un rimborso"><Input id="amount" name="amount" type="number" step="0.01" required defaultValue={outstanding > 0 ? outstanding : ''} /></Field>
        <Field label="Metodo" htmlFor="method"><Input id="method" name="method" placeholder="bonifico" /></Field>
        <div className="flex items-end"><Button type="submit" disabled={pending}>{pending ? 'Salvataggio…' : 'Registra incasso'}</Button></div>
      </form>
    </div>
  );
}
