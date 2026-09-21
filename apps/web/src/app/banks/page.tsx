import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NoTenant } from '@/components/no-tenant';
import { BankAccounts } from '../setup/payment-settings';

export default async function BanksPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const banks = (await fetchOrNull(() => api.bankAccounts())) ?? [];
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Banche</h1>
      <Card>
        <CardHeader>
          <CardTitle>Conti correnti</CardTitle>
          <CardDescription>Conti su cui ricevere i pagamenti. La banca si sceglie su ogni fattura (quella predefinita è proposta) e finisce nel blocco DatiPagamento dell&apos;XML (IBAN/BIC).</CardDescription>
        </CardHeader>
        <CardContent><BankAccounts accounts={banks} /></CardContent>
      </Card>
    </main>
  );
}
