import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from 'cn';
import { HelpTip } from '@/components/help-tip';
import { api, fetchOrNull, formatMoney, type Deadline } from '@/lib/api';

const KIND_LABELS: Record<string, string> = {
  TAX_BALANCE: 'Saldo imposta sostitutiva',
  TAX_FIRST_ADVANCE: 'Primo acconto imposta',
  TAX_SECOND_ADVANCE: 'Secondo acconto imposta',
  INPS_BALANCE: 'Saldo INPS',
  INPS_FIRST_ADVANCE: 'Primo acconto INPS',
  INPS_SECOND_ADVANCE: 'Secondo acconto INPS',
  STAMP_DUTY: 'Imposta di bollo',
  TAX_RETURN: 'Dichiarazione dei redditi',
  INTRASTAT: 'Intrastat',
};

function describe(d: Deadline): string {
  const { taxYear, percentage, quarter } = d.details;
  switch (d.kind) {
    case 'TAX_BALANCE':
      return `Saldo imposta sostitutiva ${taxYear} (o prima rata)`;
    case 'TAX_FIRST_ADVANCE':
      return `Primo acconto imposta sostitutiva ${taxYear} (${percentage}%)`;
    case 'TAX_SECOND_ADVANCE':
      return `Secondo acconto imposta sostitutiva ${taxYear} (${percentage}%)`;
    case 'INPS_BALANCE':
      return `Saldo contributi INPS Gestione Separata ${taxYear}`;
    case 'INPS_FIRST_ADVANCE':
      return `Primo acconto INPS ${taxYear} (${percentage}%)`;
    case 'INPS_SECOND_ADVANCE':
      return `Secondo acconto INPS ${taxYear} (${percentage}%)`;
    case 'STAMP_DUTY': {
      const { amount } = d.details;
      return `Bollo fatture elettroniche · ${quarter}° trimestre ${taxYear}${amount !== undefined ? ` · maturato ${formatMoney(amount)}` : ''}`;
    }
    case 'TAX_RETURN':
      return `Presentazione telematica Redditi PF ${taxYear + 1} (periodo d'imposta ${taxYear})`;
    case 'INTRASTAT':
      return `Elenco Intrastat servizi resi — ${quarter}° trimestre ${taxYear}`;
    default:
      return d.description;
  }
}

/** Side notes shown as badges with an explanation. */
function notes(d: Deadline): Array<{ label: string; help: string }> {
  const out: Array<{ label: string; help: string }> = [];
  if (d.kind === 'STAMP_DUTY' && d.details.deferredFrom) {
    out.push({
      label: `Differita dal ${formatDate(d.details.deferredFrom)}`,
      help: "Guida AdE sull'imposta di bollo (giugno 2026): se l'importo dovuto per il 1° trimestre non supera 5.000 €, si può versare entro il 30 settembre; se 1° + 2° trimestre non superano 5.000 €, entro il 30 novembre. È una facoltà: la scadenza ordinaria resta valida.",
    });
  }
  if (d.details.splittable === false) {
    out.push({ label: 'Non rateizzabile', help: 'Le istruzioni Redditi PF ammettono la rateazione solo di saldo e primo acconto (D.Lgs. 33/2025 art. 10).' });
  }
  if (d.kind === 'TAX_RETURN') {
    out.push({ label: 'Solo presentazione', help: 'Termine telematico (DPR 322/1998 art. 2). I versamenti di saldo e acconti hanno scadenze proprie.' });
  }
  return out;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default async function DeadlinesPage({ searchParams }: PageProps<'/deadlines'>) {
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getFullYear());
  const [deadlines, ruleSets, ruleStatus] = await Promise.all([
    fetchOrNull(() => api.deadlines(year)),
    fetchOrNull(() => api.ruleSets(year)),
    fetchOrNull(() => api.ruleSetStatus(year)),
  ]);
  const active = ruleSets?.find((r) => r.status === 'ACTIVE');
  const today = new Date().toISOString().slice(0, 10);
  // The next deadline date (all rows sharing it are highlighted, e.g. balance + first advance on the same day).
  const nextDate = deadlines?.find((d) => d.date >= today)?.date;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Scadenzario {year}</h1>
        <p className="text-sm text-muted-foreground">
          Generato dal set di regole fiscali attivo per l&apos;anno e dai tuoi dati (profilo, fatture): bollo differito secondo gli importi maturati, Intrastat solo se operi con soggetti UE. Le date slittano al primo giorno lavorativo utile.
        </p>
      </header>

      {!active || !deadlines ? (
        <Card>
          <CardHeader>
            <CardTitle>{active ? `Set di regole ${year} non utilizzabile` : `Nessun set di regole attivo per il ${year}`}</CardTitle>
            <CardDescription>
              {ruleStatus?.reason ?? 'Un amministratore deve attivare il set di regole prima che il calendario possa essere generato.'}
              {ruleSets?.length ? ` Set disponibili: ${ruleSets.map((r) => `v${r.version} (${r.status})`).join(', ')}.` : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Adempimenti</CardTitle>
            <CardDescription>
              Regole v{active.version}, attivate il {active.activatedAt ? formatDate(active.activatedAt.slice(0, 10)) : '—'}.
              {nextDate && <> Prossima scadenza: <span className="font-medium text-foreground">{formatDate(nextDate)}</span>.</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Adempimento</TableHead>
                  <TableHead>Dettaglio</TableHead>
                  <TableHead>Codice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((d) => {
                  const isNext = d.date === nextDate;
                  const isPast = d.date < today;
                  return (
                  <TableRow
                    key={`${d.kind}-${d.details.quarter ?? ''}-${d.nominalDate}`}
                    className={cn(isNext && 'bg-primary/10 hover:bg-primary/15 font-medium', isPast && 'text-muted-foreground')}
                    aria-current={isNext ? 'date' : undefined}
                  >
                    <TableCell className="font-mono whitespace-nowrap">
                      {isNext && <span className="mr-2 inline-block size-2 rounded-full bg-primary align-middle" aria-hidden />}
                      {formatDate(d.date)}
                      {d.date !== d.nominalDate && (
                        <span className="ml-2 text-xs text-muted-foreground">(nom. {formatDate(d.nominalDate)})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{KIND_LABELS[d.kind] ?? d.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span>{describe(d)}</span>
                      {notes(d).map((n) => (
                        <span key={n.label} className="ml-2 inline-flex items-center gap-1 align-middle">
                          <Badge variant="outline">{n.label}</Badge>
                          <HelpTip label={n.label}><p>{n.help}</p></HelpTip>
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="font-mono">{d.code ?? '—'}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
