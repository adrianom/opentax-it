import Link from 'next/link';
import { api, currentTenantId, fetchOrNull, formatMoney } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NoTenant } from '@/components/no-tenant';
import { YearDataForm } from './year-data-form';

function Row({ label, value, code, strong }: { label: string; value: string; code?: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1 ${strong ? 'font-medium' : ''}`}>
      <span className="text-sm">{label}{code && <span className="ml-2 font-mono text-xs text-muted-foreground">{code}</span>}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

export default async function TaxesPage({ searchParams }: PageProps<'/taxes'>) {
  if (!(await currentTenantId())) return <NoTenant />;
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getFullYear());
  const s = await fetchOrNull(() => api.taxSummary(year));
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Imposte {year}</h1>
          <p className="text-sm text-muted-foreground">Periodo d&apos;imposta {year}: dichiarazione e versamenti nel {year + 1}. Stima, non consulenza fiscale.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/taxes?year=${year - 1}`} />}>{year - 1}</Button>
          <Button variant="outline" render={<Link href={`/taxes?year=${year + 1}`} />}>{year + 1}</Button>
        </div>
      </div>

      {!s ? (
        <Card><CardHeader><CardTitle>Calcolo non disponibile</CardTitle><CardDescription>Serve un set di regole attivo per il {year} o il {year + 1} e un profilo fiscale completo.</CardDescription></CardHeader></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reddito e imposta sostitutiva</CardTitle>
                <CardDescription>Quadro LM sez. III — regole {s.rulesYear}{s.rulesYear === s.year ? ' (in attesa del set dell’anno successivo)' : ''}.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label={`Incassato nel ${year} (principio di cassa)`} value={formatMoney(s.collectedRevenue)} code="LM22 c.3" />
                <Row label={`Coefficiente di redditività (ATECO ${s.input.atecoCode})`} value={`${s.result.coefficientPct}%`} code="LM22 c.2" />
                <Row label="Reddito lordo" value={formatMoney(s.result.grossIncome)} code="LM34" />
                <Row label="Contributi previdenziali dedotti" value={`− ${formatMoney(s.result.contributionsDeducted)}`} code="LM35 c.2" />
                <Row label="Reddito imponibile" value={formatMoney(s.result.netIncome)} code="LM36" strong />
                <Row label={`Imposta sostitutiva ${s.result.taxRatePct}%`} value={formatMoney(s.result.substituteTax)} code="LM39" />
                <Row label="Crediti e ritenute" value={`− ${formatMoney(s.input.taxCredits)}`} code="LM40-41" />
                <Row label="Acconti già versati" value={`− ${formatMoney(s.input.taxAdvancesPaid)}`} code="LM45" />
                <Row label={s.taxBalance >= 0 ? 'Saldo a debito' : 'Saldo a credito'} value={formatMoney(Math.abs(s.taxBalance))} code={s.taxBalance >= 0 ? '1792' : 'LM47'} strong />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>INPS Gestione Separata</CardTitle>
                <CardDescription>Quadro RR sez. II — aliquota {s.input.inpsRatePct}%.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Imponibile previdenziale (reddito lordo, entro il massimale)" value={formatMoney(s.result.inpsTaxableIncome)} code="RR5 c.11" />
                <Row label="Contributo dovuto" value={formatMoney(s.result.inpsContribution)} code="RR5 c.15" />
                <Row label="Acconti già versati" value={`− ${formatMoney(s.input.inpsAdvancesPaid)}`} code="RR5 c.16" />
                <Row label={s.inpsBalance >= 0 ? 'Saldo a debito' : 'Saldo a credito'} value={formatMoney(Math.abs(s.inpsBalance))} code={s.inpsBalance >= 0 ? 'PXX' : 'RR8'} strong />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acconti per il {year + 1}</CardTitle>
              <CardDescription>Imposta: 100% dell&apos;imposta {year} al netto di crediti (Istr. RN62 via Circ. 10/E/2016). INPS: 80% del contributo, in due rate (L. 662/96 c. 212).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="divide-y">
                <Row label="Imposta sostitutiva — totale" value={formatMoney(s.nextYearAdvances.tax.total)} strong />
                {s.nextYearAdvances.tax.mode === 'NOT_DUE' && <p className="py-1 text-sm text-muted-foreground">Non dovuto (imposta inferiore a 51,65 €).</p>}
                {s.nextYearAdvances.tax.mode === 'SINGLE' && <Row label="Unica soluzione (30 novembre)" value={formatMoney(s.nextYearAdvances.tax.second)} code="1791" />}
                {s.nextYearAdvances.tax.mode === 'TWO_INSTALMENTS' && (
                  <>
                    <Row label="Prima rata 40% (con il saldo)" value={formatMoney(s.nextYearAdvances.tax.first)} code="1790" />
                    <Row label="Seconda rata 60% (30 novembre)" value={formatMoney(s.nextYearAdvances.tax.second)} code="1791" />
                  </>
                )}
              </div>
              <div className="divide-y">
                <Row label="INPS — totale (80%)" value={formatMoney(s.nextYearAdvances.inps.total)} strong />
                <Row label="Prima rata 40% (con il saldo)" value={formatMoney(s.nextYearAdvances.inps.first)} code="PXX" />
                <Row label="Seconda rata 40% (30 novembre)" value={formatMoney(s.nextYearAdvances.inps.second)} code="PXX" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soglie del regime</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm">
              <span>Incassato {formatMoney(s.collectedRevenue)}</span>
              <Badge variant={s.thresholds.exceedsAccessThreshold ? 'destructive' : 'secondary'}>85.000 € {s.thresholds.exceedsAccessThreshold ? 'superata: uscita dal regime l’anno successivo (c. 71)' : 'ok'}</Badge>
              <Badge variant={s.thresholds.exceedsExitThreshold ? 'destructive' : 'secondary'}>100.000 € {s.thresholds.exceedsExitThreshold ? 'superata: uscita immediata e IVA (c. 71)' : 'ok'}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dati dell&apos;anno inseriti a mano</CardTitle>
              <CardDescription>Finché il modulo F24 non registra i versamenti, questi importi vanno indicati qui (dai tuoi F24 pagati).</CardDescription>
            </CardHeader>
            <CardContent><YearDataForm year={year} input={s.input} /></CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
