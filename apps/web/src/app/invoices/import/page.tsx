import { currentTenantId } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NoTenant } from '@/components/no-tenant';
import { ImportForm } from './import-form';

export default async function ImportInvoicesPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Importa fatture da XML</CardTitle>
          <CardDescription>Carica le fatture elettroniche emesse con altri software (es. dal commercialista) per completare numerazione, bolli e incassi dell&apos;anno.</CardDescription>
        </CardHeader>
        <CardContent><ImportForm /></CardContent>
      </Card>
    </main>
  );
}
