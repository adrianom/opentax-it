import { api, currentTenantId, fetchOrNull, formatDate } from '@/lib/api';
import { activateRuleSet, seedRuleSets, selectTenant } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NativeSelect } from '@/components/native-select';
import { TenantForm } from './tenant-form';

export default async function SetupPage() {
  const year = new Date().getFullYear();
  const [tenants, offices, me, ruleSets, ruleStatus] = await Promise.all([
    fetchOrNull(() => api.tenants()),
    fetchOrNull(() => api.inpsOffices()),
    fetchOrNull(() => api.me()),
    fetchOrNull(() => api.ruleSets(year)),
    fetchOrNull(() => api.ruleSetStatus(year)),
  ]);
  const current = await currentTenantId();
  const list = tenants ?? [];
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle>Partita IVA attiva</CardTitle>
          <CardDescription>Finché non c&apos;è l&apos;autenticazione, la partita IVA attiva è salvata in un cookie del browser.</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length > 0 ? (
            <form action={selectTenant} className="flex max-w-md gap-2">
              <NativeSelect name="tenantId" defaultValue={current ?? list[0].id}>
                {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </NativeSelect>
              <Button type="submit">Usa</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna partita IVA: creala qui sotto.</p>
          )}
        </CardContent>
      </Card>

      {me ? (
        <Card>
          <CardHeader>
            <CardTitle>Profilo fiscale — {me.name}</CardTitle>
            <CardDescription>Dati del cedente/prestatore usati nelle fatture elettroniche (FatturaPA, CedentePrestatore) e negli F24.</CardDescription>
          </CardHeader>
          <CardContent><TenantForm offices={offices ?? []} current={{ name: me.name, profile: me.profile }} /></CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nuova partita IVA</CardTitle>
        </CardHeader>
        <CardContent><TenantForm offices={offices ?? []} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regole fiscali {year}</CardTitle>
          <CardDescription>
            Ogni set è versionato e cita le fonti ufficiali. Il software usa solo il set attivo; l&apos;attivazione è sempre manuale.
            {ruleStatus && !ruleStatus.ok && <span className="block font-medium text-destructive">{ruleStatus.reason}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader><TableRow><TableHead>Versione</TableHead><TableHead>Stato</TableHead><TableHead>Attivato il</TableHead><TableHead>Note</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {(ruleSets ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">v{r.version}</TableCell>
                  <TableCell><Badge variant={r.status === 'ACTIVE' ? 'default' : 'outline'}>{r.status}</Badge></TableCell>
                  <TableCell>{r.activatedAt ? formatDate(r.activatedAt) : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                  <TableCell className="text-right">
                    {r.status !== 'ACTIVE' && r.status !== 'SUPERSEDED' && (
                      <form action={activateRuleSet}><input type="hidden" name="id" value={r.id} /><Button size="sm" type="submit">Attiva</Button></form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(ruleSets ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun set caricato.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <form action={seedRuleSets}>
            <Button variant="outline" type="submit">Carica set forniti con l&apos;applicazione</Button>
            <p className="mt-1 text-xs text-muted-foreground">Crea una nuova versione in bozza solo se il contenuto è cambiato; non attiva nulla.</p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
