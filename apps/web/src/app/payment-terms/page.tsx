import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NoTenant } from '@/components/no-tenant';
import { PaymentTermsList } from '../setup/payment-settings';

export default async function PaymentTermsPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const terms = (await fetchOrNull(() => api.paymentTerms())) ?? [];
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Profili di scadenza</h1>
      <Card>
        <CardHeader>
          <CardTitle>Condizioni di pagamento</CardTitle>
          <CardDescription>Selezionabili su ogni fattura: la scadenza è data fattura + giorni (DataScadenzaPagamento) con la modalità indicata (ModalitaPagamento, spec. FatturaPA 1.9.1).</CardDescription>
        </CardHeader>
        <CardContent><PaymentTermsList terms={terms} /></CardContent>
      </Card>
    </main>
  );
}
