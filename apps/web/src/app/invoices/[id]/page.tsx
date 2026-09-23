import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, customerLabel, fetchOrNull, formatDate, formatMoney, inpsSurchargeLabel } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceStatusBadge } from '@/components/invoice-status-badge';
import { TYPE_LABELS } from '../page';
import { IssueForm } from './issue-form';
import { Payments } from './payments';

export default async function InvoicePage({ params }: PageProps<'/invoices/[id]'>) {
  const { id } = await params;
  const inv = await fetchOrNull(() => api.invoice(id));
  if (!inv) notFound();
  const isDraft = inv.status === 'DRAFT';
  const rules = Number(inv.inpsSurcharge) > 0 ? await fetchOrNull(() => api.activeRules(inv.year)) : null;
  const payments = isDraft ? [] : ((await fetchOrNull(() => api.payments(id))) ?? []);
  const [terms, banks] = isDraft ? await Promise.all([fetchOrNull(() => api.paymentTerms()), fetchOrNull(() => api.bankAccounts())]) : [null, null];
  const chosenTerms = terms?.find((t) => t.id === inv.paymentTermsId) ?? terms?.find((t) => t.isDefault);
  const chosenBank = banks?.find((b) => b.id === inv.bankAccountId) ?? banks?.find((b) => b.isDefault);
  const defaultDueDate = chosenTerms ? new Date(new Date(inv.date).getTime() + chosenTerms.days * 86_400_000).toISOString().slice(0, 10) : undefined;
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{TYPE_LABELS[inv.type]} {inv.number || '(bozza)'}</h1>
          <InvoiceStatusBadge status={inv.status} />
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(inv.date)} · {customerLabel(inv.customer)}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {isDraft && <Button variant="outline" render={<Link href={`/invoices/${inv.id}/edit`} />}>Modifica</Button>}
        <Button variant="outline" render={<a href={`/invoices/${inv.id}/pdf?inline=1`} target="_blank" rel="noreferrer" />}>Anteprima</Button>
        <Button variant="outline" render={<a href={`/invoices/${inv.id}/pdf`} />}>Scarica PDF</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Righe</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Descrizione</TableHead><TableHead className="text-right">Q.tà</TableHead><TableHead className="text-right">Prezzo</TableHead><TableHead className="text-right">Totale</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {inv.lines?.map((l) => (
                <TableRow key={l.lineNumber}>
                  <TableCell>{l.lineNumber}</TableCell>
                  <TableCell>{l.description}</TableCell>
                  <TableCell className="text-right font-mono">{Number(l.quantity)} {l.unit ?? ''}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(l.unitPrice, inv.currency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(l.totalPrice, inv.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <dl className="ml-auto grid w-full max-w-sm grid-cols-2 gap-1 text-sm">
            <dt className="text-muted-foreground">Imponibile</dt><dd className="text-right font-mono">{formatMoney(inv.taxableAmount, inv.currency)}</dd>
            {Number(inv.inpsSurcharge) > 0 && <><dt className="text-muted-foreground">{inpsSurchargeLabel(rules?.inps.surchargePct)}</dt><dd className="text-right font-mono">{formatMoney(inv.inpsSurcharge, inv.currency)}</dd></>}
            <dt className="text-muted-foreground">IVA</dt><dd className="text-right font-mono">— ({inv.vatNature.replace('_', '.')})</dd>
            {inv.virtualStamp && <><dt className="text-muted-foreground">Bollo virtuale</dt><dd className="text-right font-mono">{formatMoney(inv.stampAmount, inv.currency)}</dd></>}
            <dt className="font-medium">Totale documento</dt><dd className="text-right font-mono font-medium">{formatMoney(inv.total, inv.currency)}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diciture in fattura</CardTitle></CardHeader>
        <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{inv.notes.map((n) => <li key={n}>{n}</li>)}</ul></CardContent>
      </Card>

      {isDraft ? (
        <Card>
          <CardHeader>
            <CardTitle>Emetti</CardTitle>
            <CardDescription>Assegna il numero progressivo, genera l&apos;XML FatturaPA e lo salva. Dopo l&apos;emissione il documento non è più modificabile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Scadenza: {chosenTerms ? `${chosenTerms.name} (${chosenTerms.days} gg)` : 'nessuna'} · Banca: {chosenBank ? chosenBank.name : 'nessuna'}. Puoi modificare i valori qui sotto prima di emettere.</p>
            <IssueForm id={inv.id} defaultDueDate={defaultDueDate} defaultIban={chosenBank?.iban} />
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
          <CardHeader>
            <CardTitle>Incassi</CardTitle>
            <CardDescription>Principio di cassa: il compenso concorre al reddito dell&apos;anno in cui viene incassato (L. 190/2014 art. 1 c. 64).</CardDescription>
          </CardHeader>
          <CardContent><Payments invoiceId={inv.id} currency={inv.currency} total={Number(inv.total)} payments={payments} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>File e Stampa</CardTitle>
            <CardDescription>{inv.xmlFileName ? `XML: ${inv.xmlFileName}` : 'Documento emesso'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button render={<a href={`/invoices/${inv.id}/pdf?inline=1`} target="_blank" rel="noreferrer" />}>Anteprima</Button>
            <Button variant="outline" render={<a href={`/invoices/${inv.id}/pdf`} />}>Scarica PDF</Button>
            {inv.xmlFileName && <Button variant="outline" render={<a href={`/invoices/${inv.id}/xml`} />}>Scarica XML</Button>}
            <Button variant="ghost" render={<Link href="/invoices" />}>Torna all&apos;elenco</Button>
          </CardContent>
        </Card>
        </>
      )}
    </main>
  );
}
