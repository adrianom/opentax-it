import Link from 'next/link';
import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { deleteBankAccount } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoTenant } from '@/components/no-tenant';

export default async function BanksPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const banks = (await fetchOrNull(() => api.bankAccounts())) ?? [];
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Banche</h1>
          <p className="text-sm text-muted-foreground">Conti su cui ricevere i pagamenti. La banca si sceglie su ogni fattura (quella predefinita è proposta) e finisce nel blocco DatiPagamento dell&apos;XML (IBAN/BIC).</p>
        </div>
        <Button render={<Link href="/banks/new" />}>Nuova banca</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>{banks.length} conti correnti</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Banca</TableHead><TableHead>IBAN</TableHead><TableHead>BIC</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {banks.map((b) => (
                <TableRow key={b.id}>
                  <TableCell><Link href={`/banks/${b.id}`} className="font-medium hover:underline">{b.name}</Link> {b.isDefault && <Badge variant="secondary">predefinita</Badge>}</TableCell>
                  <TableCell>{b.bankName ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{b.iban}</TableCell>
                  <TableCell className="font-mono text-xs">{b.bic ?? '—'}</TableCell>
                  <TableCell className="text-right"><form action={deleteBankAccount}><input type="hidden" name="id" value={b.id} /><Button variant="ghost" size="sm" type="submit">Elimina</Button></form></TableCell>
                </TableRow>
              ))}
              {banks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessuna banca. Aggiungine una per indicare l&apos;IBAN in fattura.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
