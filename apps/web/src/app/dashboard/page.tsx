import Link from 'next/link';
import { api, currentTenantId, customerLabel, fetchOrNull, formatDate, formatMoney, type Deadline, type Invoice } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NoTenant } from '@/components/no-tenant';
import { STATUS_LABELS } from '../invoices/page';

function describeDeadline(d: Deadline): string {
  const { taxYear, percentage, quarter } = d.details;
  const map: Record<string, string> = {
    TAX_BALANCE: `Saldo imposta sostitutiva ${taxYear}`,
    TAX_FIRST_ADVANCE: `1° acconto imposta ${taxYear} (${percentage}%)`,
    TAX_SECOND_ADVANCE: `2° acconto imposta ${taxYear} (${percentage}%)`,
    INPS_BALANCE: `Saldo INPS ${taxYear}`,
    INPS_FIRST_ADVANCE: `1° acconto INPS ${taxYear}`,
    INPS_SECOND_ADVANCE: `2° acconto INPS ${taxYear}`,
    STAMP_DUTY: `Bollo fatture — ${quarter}° trim. ${taxYear}${d.details.deferredFrom ? ' (differito)' : ''}`,
    TAX_RETURN: `Dichiarazione Redditi PF ${taxYear + 1}`,
    INTRASTAT: `Intrastat — ${quarter}° trim. ${taxYear}`,
  };
  return map[d.kind] ?? d.description;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  if (!(await currentTenantId())) return <NoTenant />;
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const [invoices, deadlines, ruleSet, ruleStatus, taxes] = await Promise.all([
    fetchOrNull(() => api.invoices(year)),
    fetchOrNull(() => api.deadlines(year)),
    fetchOrNull(() => api.ruleSets(year)),
    fetchOrNull(() => api.ruleSetStatus(year)),
    fetchOrNull(() => api.taxSummary(year)),
  ]);
  const all: Invoice[] = invoices ?? [];
  const issued = all.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED');
  const revenue = issued.reduce((s, i) => s + (i.type === 'TD04' ? -1 : 1) * (Number(i.taxableAmount) + Number(i.inpsSurcharge)), 0);
  const drafts = all.filter((i) => i.status === 'DRAFT').length;
  const toSend = issued.filter((i) => i.status === 'ISSUED').length;
  const stamps = issued.filter((i) => i.virtualStamp).length;
  const collected = taxes?.collectedRevenue ?? 0;
  const threshold = taxes?.thresholds.accessThreshold ?? 85_000;
  const pct = Math.min(100, Math.round((collected / threshold) * 100));
  const upcoming = (deadlines ?? []).filter((d) => d.date >= today).slice(0, 6);
  const active = ruleSet?.find((r) => r.status === 'ACTIVE');

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard {year}</h1>
          <p className="text-sm text-muted-foreground">Regole fiscali {active ? `v${active.version} attive` : 'non attive — attivale dalle impostazioni'}.</p>
          {ruleStatus && !ruleStatus.ok && <p className="text-sm font-medium text-destructive">{ruleStatus.reason}</p>}
        </div>
        <Button render={<Link href="/invoices/new" />}>Nuova fattura</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Incassato nell'anno" value={formatMoney(collected)} hint={`Emesso: ${formatMoney(revenue)} (imponibile + rivalsa, al netto delle note di credito)`} />
        <StatTile label="Documenti emessi" value={String(issued.length)} hint={`${drafts} bozze`} />
        <StatTile label="Da inviare allo SDI" value={String(toSend)} hint="Emesse ma non ancora trasmesse" />
        <StatTile label="Bolli virtuali" value={formatMoney(stamps * 2)} hint={`${stamps} fatture con bollo da 2 €`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Soglia forfettario</CardTitle>
            <CardDescription>85.000 € di ricavi/compensi incassati (L. 190/2014 c. 54). {taxes ? <>Imposta stimata {formatMoney(taxes.result.substituteTax)}, INPS {formatMoney(taxes.result.inpsContribution)} — <Link href="/taxes" className="underline">dettaglio</Link>.</> : null}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-mono">{formatMoney(collected)}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={threshold} aria-valuenow={collected} aria-label="Incassato rispetto alla soglia">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            {collected > threshold && <p className="text-sm font-medium">⚠ Soglia superata: uscita dal regime dall&apos;anno successivo (c. 71).</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prossime scadenze</CardTitle>
            <CardDescription><Link href="/deadlines" className="underline">Scadenzario completo</Link></CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Adempimento</TableHead><TableHead>Codice</TableHead></TableRow></TableHeader>
              <TableBody>
                {upcoming.map((d) => (
                  <TableRow key={`${d.kind}-${d.details.quarter ?? ''}-${d.nominalDate}`}>
                    <TableCell className="font-mono whitespace-nowrap">{formatDate(d.date)}</TableCell>
                    <TableCell>{describeDeadline(d)}</TableCell>
                    <TableCell className="font-mono">{d.code ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {upcoming.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nessuna scadenza disponibile (set di regole non attivo?)</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ultimi documenti</CardTitle>
          <CardDescription><Link href="/invoices" className="underline">Tutte le fatture</Link></CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Totale</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
            <TableBody>
              {all.slice(0, 5).map((i) => (
                <TableRow key={i.id}>
                  <TableCell><Link href={`/invoices/${i.id}`} className="font-mono hover:underline">{i.number || '(bozza)'}</Link></TableCell>
                  <TableCell>{formatDate(i.date)}</TableCell>
                  <TableCell>{customerLabel(i.customer)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(i.total, i.currency)}</TableCell>
                  <TableCell><Badge variant={i.status === 'DRAFT' ? 'outline' : 'secondary'}>{STATUS_LABELS[i.status]}</Badge></TableCell>
                </TableRow>
              ))}
              {all.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nessun documento nel {year}.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
