import Link from 'next/link';
import { api, currentTenantId, customerLabel, fetchOrNull, formatDate, formatMoney, type InvoiceStatus } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoTenant } from '@/components/no-tenant';

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Bozza',
  ISSUED: 'Emessa',
  SENT: 'Inviata a SDI',
  DELIVERED: 'Consegnata',
  NOT_DELIVERED: 'Non consegnata',
  REJECTED: 'Scartata',
  CANCELLED: 'Annullata',
};

export const TYPE_LABELS: Record<string, string> = { TD01: 'Fattura', TD04: 'Nota di credito', TD05: 'Nota di debito', TD06: 'Parcella' };

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
  if (!(await currentTenantId())) return <NoTenant />;
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getFullYear());
  const invoices = (await fetchOrNull(() => api.invoices(year))) ?? [];
  const collected = invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED' && i.type !== 'TD04');
  const total = collected.reduce((s, i) => s + Number(i.taxableAmount) + Number(i.inpsSurcharge), 0);
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fatture {year}</h1>
          <p className="text-sm text-muted-foreground">Emesso (imponibile + rivalsa, escluse note di credito): {formatMoney(total)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/invoices?year=${year - 1}`} />}>{year - 1}</Button>
          <Button variant="outline" render={<Link href={`/invoices?year=${year + 1}`} />}>{year + 1}</Button>
          <Button variant="outline" render={<Link href="/invoices/import" />}>Importa XML</Button>
          <Button render={<Link href="/invoices/new" />}>Nuova fattura</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>{invoices.length} documenti</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell><Link href={`/invoices/${i.id}`} className="font-mono font-medium hover:underline">{i.number || '(bozza)'}</Link></TableCell>
                  <TableCell>{formatDate(i.date)}</TableCell>
                  <TableCell>{TYPE_LABELS[i.type] ?? i.type}</TableCell>
                  <TableCell>{customerLabel(i.customer)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(i.total, i.currency)}</TableCell>
                  <TableCell><Badge variant={i.status === 'DRAFT' ? 'outline' : i.status === 'REJECTED' ? 'destructive' : 'secondary'}>{STATUS_LABELS[i.status]}</Badge></TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nessun documento nel {year}.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
