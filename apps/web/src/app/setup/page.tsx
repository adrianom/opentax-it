import Link from 'next/link';
import { api, currentTenantId, fetchOrNull, formatDate } from '@/lib/api';
import { activateRuleSet, seedRuleSets, selectTenant } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NativeSelect } from '@/components/native-select';
import { TenantForm } from './tenant-form';
import { CircleCheck } from 'lucide-react';
import { ConfirmRowAction, RowActions } from '@/components/row-actions';

export default async function SetupPage() {
  const year = new Date().getFullYear();
  const ruleYears = [year - 1, year, year + 1];
  const [tenants, offices, me, rules, ...ruleRows] = await Promise.all([
    fetchOrNull(() => api.tenants()),
    fetchOrNull(() => api.inpsOffices()),
    fetchOrNull(() => api.me()),
    fetchOrNull(() => api.activeRules(year)),
    ...ruleYears.map((y) => Promise.all([fetchOrNull(() => api.ruleSets(y)), fetchOrNull(() => api.ruleSetStatus(y))])),
  ]);
  const rulesByYear = ruleYears.map((y, i) => ({ year: y, ruleSets: ruleRows[i]?.[0] ?? [], ruleStatus: ruleRows[i]?.[1] ?? null }));
  const current = await currentTenantId();
  const list = tenants ?? [];
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Impostazioni</h1>
      <div className="flex justify-end gap-2"><Button render={<Link href="/setup/new" />}>Nuova partita IVA</Button></div>

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
            <p className="text-sm text-muted-foreground">Nessuna partita IVA: creala con il pulsante &quot;Nuova partita IVA&quot;.</p>
          )}
        </CardContent>
      </Card>

      {me ? (
        <Card>
          <CardHeader>
            <CardTitle>Profilo fiscale — {me.name}</CardTitle>
            <CardDescription>Dati del cedente/prestatore usati nelle fatture elettroniche (FatturaPA, CedentePrestatore) e negli F24.</CardDescription>
          </CardHeader>
          <CardContent><TenantForm offices={offices ?? []} current={{ name: me.name, profile: me.profile }} surchargePct={rules?.inps.surchargePct} /></CardContent>
        </Card>
      ) : null}

      {rulesByYear.map(({ year: y, ruleSets, ruleStatus }) => (
        <Card key={y}>
          <CardHeader>
            <CardTitle>Regole fiscali {y}</CardTitle>
            <CardDescription>
              {y === year - 1 && `Anno d'imposta ${y}: aliquote, coefficiente e massimale INPS per il calcolo delle imposte ${y} (dichiarazione e versamenti nel ${year}). `}
              {y === year && `Anno di versamento ${y}: scadenze, acconti, codici e regole per le fatture emesse nel ${y}. `}
              {y === year + 1 && `Serve per il calcolo dell'anno d'imposta ${year} appena la normativa ${y} sarà pubblicata e verificata. `}
              Ogni set è versionato e cita le fonti ufficiali; il software usa solo il set attivo e l&apos;attivazione è sempre manuale.
              {ruleStatus && !ruleStatus.ok && ruleSets.length > 0 && <span className="block font-medium text-destructive">{ruleStatus.reason}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Versione</TableHead><TableHead>Stato</TableHead><TableHead>Attivato il</TableHead><TableHead>Note</TableHead><TableHead className="text-right">Azioni</TableHead></TableRow></TableHeader>
              <TableBody>
                {ruleSets.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">v{r.version}</TableCell>
                    <TableCell><Badge variant={r.status === 'ACTIVE' ? 'default' : 'outline'}>{r.status}</Badge></TableCell>
                    <TableCell>{r.activatedAt ? formatDate(r.activatedAt) : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                    <TableCell>
                      {r.status !== 'ACTIVE' && r.status !== 'SUPERSEDED' && (
                        <RowActions>
                          <ConfirmRowAction action={activateRuleSet} fields={{ id: r.id }} label="Attiva" confirm={`Attivare il set ${y} v${r.version}? Il set attivo diventerà superato e non potrà tornare attivo.`}><CircleCheck /></ConfirmRowAction>
                        </RowActions>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {ruleSets.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun set caricato.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      <form action={seedRuleSets}>
        <Button variant="outline" type="submit">Carica set forniti con l&apos;applicazione</Button>
        <p className="mt-1 text-xs text-muted-foreground">Crea una nuova versione in bozza solo se il contenuto è cambiato; non attiva nulla.</p>
      </form>
    </main>
  );
}
