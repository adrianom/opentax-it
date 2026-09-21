import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchDeadlines, fetchRuleSets, type Deadline } from '@/lib/api';

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
  const { taxYear, percentage, quarter, splittable } = d.details;
  switch (d.kind) {
    case 'TAX_BALANCE':
      return `Saldo imposta sostitutiva ${taxYear} (o prima rata)`;
    case 'TAX_FIRST_ADVANCE':
      return `Primo acconto imposta sostitutiva ${taxYear} (${percentage}%)`;
    case 'TAX_SECOND_ADVANCE':
      return `Secondo acconto imposta sostitutiva ${taxYear} (${percentage}%)${splittable === false ? ' — non rateizzabile' : ''}`;
    case 'INPS_BALANCE':
      return `Saldo contributi INPS Gestione Separata ${taxYear}`;
    case 'INPS_FIRST_ADVANCE':
      return `Primo acconto INPS ${taxYear} (${percentage}%)`;
    case 'INPS_SECOND_ADVANCE':
      return `Secondo acconto INPS ${taxYear} (${percentage}%)`;
    case 'STAMP_DUTY':
      return `Imposta di bollo fatture elettroniche — ${quarter}° trimestre ${taxYear}`;
    case 'TAX_RETURN':
      return `Presentazione Redditi PF ${taxYear + 1} (periodo d'imposta ${taxYear})`;
    case 'INTRASTAT':
      return `Elenco Intrastat servizi resi — ${quarter}° trimestre ${taxYear}`;
    default:
      return d.description;
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default async function DeadlinesPage({ searchParams }: PageProps<'/deadlines'>) {
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getFullYear());
  const [deadlines, ruleSets] = await Promise.all([fetchDeadlines(year, { intrastat: true }), fetchRuleSets(year)]);
  const active = ruleSets?.find((r) => r.status === 'ACTIVE');

  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Scadenzario {year}</h1>
        <p className="text-sm text-muted-foreground">
          Generato dal set di regole fiscali attivo per l&apos;anno. Le date slittano al primo giorno lavorativo utile.
        </p>
      </header>

      {!active || !deadlines ? (
        <Card>
          <CardHeader>
            <CardTitle>Nessun set di regole attivo per il {year}</CardTitle>
            <CardDescription>
              Un amministratore deve attivare il set di regole prima che il calendario possa essere generato.
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
                {deadlines.map((d) => (
                  <TableRow key={`${d.kind}-${d.date}-${d.description}`}>
                    <TableCell className="font-mono whitespace-nowrap">
                      {formatDate(d.date)}
                      {d.date !== d.nominalDate && (
                        <span className="ml-2 text-xs text-muted-foreground">(nom. {formatDate(d.nominalDate)})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{KIND_LABELS[d.kind] ?? d.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{describe(d)}</TableCell>
                    <TableCell className="font-mono">{d.code ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
