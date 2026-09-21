import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { selectTenant } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/native-select';
import { TenantForm } from './tenant-form';

export default async function SetupPage() {
  const tenants = (await fetchOrNull(() => api.tenants())) ?? [];
  const offices = (await fetchOrNull(() => api.inpsOffices())) ?? [];
  const current = await currentTenantId();
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Partita IVA</h1>
      {tenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seleziona</CardTitle>
            <CardDescription>Finché non c&apos;è l&apos;autenticazione, la partita IVA attiva è salvata in un cookie del browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={selectTenant} className="flex gap-2">
              <NativeSelect name="tenantId" defaultValue={current ?? tenants[0].id}>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </NativeSelect>
              <Button type="submit">Usa</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Nuova partita IVA</CardTitle>
          <CardDescription>Dati del cedente/prestatore usati nelle fatture elettroniche (FatturaPA, CedentePrestatore).</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantForm offices={offices} />
        </CardContent>
      </Card>
    </main>
  );
}
