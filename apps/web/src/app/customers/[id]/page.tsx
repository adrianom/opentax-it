import { notFound } from 'next/navigation';
import { api, fetchOrNull } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '../customer-form';

export default async function EditCustomerPage({ params }: PageProps<'/customers/[id]'>) {
  const { id } = await params;
  const customer = await fetchOrNull(() => api.customer(id));
  if (!customer) notFound();
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Card>
        <CardHeader><CardTitle>Modifica cliente</CardTitle></CardHeader>
        <CardContent><CustomerForm customer={customer} /></CardContent>
      </Card>
    </main>
  );
}
