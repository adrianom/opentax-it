import Link from 'next/link';
import { api, currentTenantId, customerLabel, fetchOrNull } from '@/lib/api';
import { deleteCustomer } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoTenant } from '@/components/no-tenant';

const KIND_LABELS: Record<string, string> = { IT_B2B: 'Italia B2B', IT_B2C: 'Italia privato', IT_PA: 'PA', EU: 'UE', NON_EU: 'Extra UE' };

export default async function CustomersPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const customers = (await fetchOrNull(() => api.customers())) ?? [];
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Clienti</h1>
      <div className="flex justify-end gap-2"><Button render={<Link href="/customers/new" />}>Nuovo cliente</Button></div>
      <Card>
        <CardHeader><CardTitle>{customers.length} clienti</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>P. IVA / CF</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Cod. destinatario</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Link href={`/customers/${c.id}`} className="font-medium hover:underline">{customerLabel(c)}</Link></TableCell>
                  <TableCell><Badge variant="secondary">{KIND_LABELS[c.kind] ?? c.kind}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{c.vatNumber ? `${c.countryCode}${c.vatNumber}` : c.fiscalCode}</TableCell>
                  <TableCell className="text-sm">{c.city}{c.province ? ` (${c.province})` : ''}, {c.country}</TableCell>
                  <TableCell className="font-mono text-sm">{c.recipientCode}{c.recipientPec ? ` · ${c.recipientPec}` : ''}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteCustomer}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="ghost" size="sm" type="submit">Elimina</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nessun cliente. Creane uno per emettere la prima fattura.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
