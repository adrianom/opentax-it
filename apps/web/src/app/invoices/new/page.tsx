import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NoTenant } from '@/components/no-tenant';
import { InvoiceForm } from './invoice-form';

export default async function NewInvoicePage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const [customers, invoices, terms, banks] = await Promise.all([
    fetchOrNull(() => api.customers()),
    fetchOrNull(() => api.invoices()),
    fetchOrNull(() => api.paymentTerms()),
    fetchOrNull(() => api.bankAccounts()),
  ]);
  const issued = (invoices ?? []).filter((i) => i.status !== 'DRAFT' && i.type === 'TD01');
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuovo documento</CardTitle>
          <CardDescription>
            Bollo, rivalsa INPS, natura IVA e diciture vengono calcolati dal set di regole dell&apos;anno. Il numero viene assegnato all&apos;emissione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm customers={customers ?? []} issuedInvoices={issued.map((i) => ({ id: i.id, number: i.number }))} terms={terms ?? []} banks={banks ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
