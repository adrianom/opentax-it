import Link from 'next/link';
import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { deletePaymentTerms } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoTenant } from '@/components/no-tenant';

export default async function PaymentTermsPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const terms = (await fetchOrNull(() => api.paymentTerms())) ?? [];
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Profili di scadenza</h1>
        <p className="text-sm text-muted-foreground">Selezionabili su ogni fattura: la scadenza è data fattura + giorni (DataScadenzaPagamento) con la modalità indicata (ModalitaPagamento, spec. FatturaPA 1.9.1).</p>
      </div>
      <div className="flex justify-end gap-2"><Button render={<Link href="/payment-terms/new" />}>Nuovo profilo</Button></div>
      <Card>
        <CardHeader><CardTitle>{terms.length} condizioni di pagamento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Scadenza</TableHead><TableHead>Modalità</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Link href={`/payment-terms/${t.id}`} className="font-medium hover:underline">{t.name}</Link> {t.isDefault && <Badge variant="secondary">predefinito</Badge>}</TableCell>
                  <TableCell>{t.days} giorni dalla data fattura</TableCell>
                  <TableCell className="font-mono">{t.method}</TableCell>
                  <TableCell className="text-right"><form action={deletePaymentTerms}><input type="hidden" name="id" value={t.id} /><Button variant="ghost" size="sm" type="submit">Elimina</Button></form></TableCell>
                </TableRow>
              ))}
              {terms.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nessun profilo. Aggiungine uno per calcolare la scadenza di pagamento in fattura.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
