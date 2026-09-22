import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HelpTip } from '@/components/help-tip';
import { setF24Status } from '@/lib/actions';
import { formatDate, formatMoney, type F24, type F24Draft, type F24Line, type F24Section } from '@/lib/api';

const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PLANNED: { label: 'Pianificato', variant: 'outline' },
  SCHEDULED_I24: { label: 'I24 programmato', variant: 'secondary' },
  PAID: { label: 'Pagato', variant: 'default' },
  CANCELLED: { label: 'Annullato', variant: 'destructive' },
};

export function f24Title(f: F24Draft): string {
  if (f.kind === 'COMPENSATION') return 'Compensazione (saldo zero)';
  if (f.kind === 'SECOND_ADVANCE') return 'Secondo acconto (unica soluzione)';
  if (f.kind === 'INSTALLMENT') return `Rata ${f.installmentNumber} di ${f.installmentsTotal}`;
  if (f.kind === 'BALANCE') return 'Saldo e primo acconto (unica soluzione)';
  return f.kind;
}

/** Italian label of a line from its code and reference year (the API description is in English). */
function lineLabel(l: F24Line, taxYear: number): string {
  const y = l.referenceYear;
  const balance = y === taxYear;
  switch (l.code) {
    case '1792': return `Saldo imposta sostitutiva ${y}`;
    case '1790': return `Primo acconto imposta sostitutiva ${y}`;
    case '1791': return `Secondo acconto o unica soluzione ${y}`;
    case '1668': return `Interessi di rateazione ${y}`;
    case 'DPPI': return `Interessi di rateazione INPS ${y}`;
    case 'PXX': case 'P10': return balance ? `Saldo contributi GS ${y}` : `Acconto contributi GS ${y}`;
    case 'PXXR': case 'P10R': return balance ? `Saldo contributi GS ${y} (rata)` : `Acconto contributi GS ${y} (rata)`;
    case '4001': return `Credito IRPEF ${y}`;
    case '3844': return `Credito addizionale comunale ${y}`;
    case '3801': return `Credito addizionale regionale ${y}`;
    default: return l.description ?? '';
  }
}

const SECTION_TITLE: Record<F24Section, string> = { TREASURY: 'Sezione Erario', INPS: 'Sezione INPS', REGIONAL: 'Sezione Regioni', LOCAL: 'Sezione IMU e altri tributi locali' };

function LinesTable({ lines, section, taxYear }: { lines: F24Line[]; section: F24Section; taxYear: number }) {
  const rows = lines.filter((l) => l.section === section);
  if (rows.length === 0) return null;
  const inps = section === 'INPS';
  const local = section === 'REGIONAL' || section === 'LOCAL';
  const hasCredit = lines.some((l) => Number(l.creditAmount ?? 0) > 0);
  const debit = rows.reduce((s, l) => s + Number(l.debitAmount), 0);
  const credit = rows.reduce((s, l) => s + Number(l.creditAmount ?? 0), 0);
  const cols = (inps ? 4 : local ? 4 : 3) + (hasCredit ? 2 : 1);
  return (
    <div className="overflow-x-auto">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SECTION_TITLE[section]}</p>
      <Table>
        <TableHeader>
          <TableRow>
            {inps ? (
              <>
                <TableHead>Codice sede</TableHead>
                <TableHead>Causale</TableHead>
                <TableHead>Periodo da</TableHead>
                <TableHead>a</TableHead>
              </>
            ) : (
              <>
                {local && <TableHead>{section === 'REGIONAL' ? 'Codice regione' : 'Codice ente/comune'}</TableHead>}
                <TableHead>Codice tributo</TableHead>
                <TableHead>Rateazione</TableHead>
                <TableHead>Anno di riferimento</TableHead>
              </>
            )}
            <TableHead className="text-right">Importo a debito</TableHead>
            {hasCredit && <TableHead className="text-right">Importo a credito</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l, i) => (
            <TableRow key={l.id ?? `${l.code}-${l.referenceYear}-${i}`}>
              {inps ? (
                <>
                  <TableCell className="font-mono">{l.officeCode}</TableCell>
                  <TableCell className="font-mono">{l.code}<span className="ml-2 font-sans text-xs text-muted-foreground">{lineLabel(l, taxYear)}</span></TableCell>
                  <TableCell className="font-mono">{l.periodFrom}</TableCell>
                  <TableCell className="font-mono">{l.periodTo}</TableCell>
                </>
              ) : (
                <>
                  {local && <TableCell className="font-mono">{l.localCode ?? ''}</TableCell>}
                  <TableCell className="font-mono">{l.code}<span className="ml-2 font-sans text-xs text-muted-foreground">{lineLabel(l, taxYear)}</span></TableCell>
                  <TableCell className="font-mono">{l.installmentCode ?? ''}</TableCell>
                  <TableCell className="font-mono">{l.referenceYear}</TableCell>
                </>
              )}
              <TableCell className="text-right font-mono tabular-nums">{Number(l.debitAmount) > 0 ? formatMoney(l.debitAmount) : ''}</TableCell>
              {hasCredit && <TableCell className="text-right font-mono tabular-nums">{Number(l.creditAmount ?? 0) > 0 ? formatMoney(l.creditAmount ?? 0) : ''}</TableCell>}
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={cols - (hasCredit ? 2 : 1)} className="text-right text-xs text-muted-foreground">Totale sezione</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatMoney(debit)}</TableCell>
            {hasCredit && <TableCell className="text-right font-mono tabular-nums">{formatMoney(credit)}</TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export function F24Card({ f, taxYear, highlight }: { f: F24Draft | F24; taxYear: number; highlight?: boolean }) {
  const saved = 'id' in f ? (f as F24) : null;
  const status = saved ? STATUS[saved.status] : null;
  return (
    <Card className={highlight ? 'border-primary' : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {f24Title(f)}
              {status && <Badge variant={status.variant}>{status.label}</Badge>}
              {highlight && <Badge>Prossimo</Badge>}
            </CardTitle>
            <CardDescription>
              Scadenza {formatDate(f.paymentDate)}
              {f.nominalPaymentDate && f.nominalPaymentDate !== f.paymentDate && ` (nominale ${formatDate(f.nominalPaymentDate)}, spostata al primo giorno feriale)`}
              {f.i24CancelBy && (
                <>
                  {' · '}I24 annullabile entro il {formatDate(f.i24CancelBy)}
                  <HelpTip><p>F24 con addebito a data futura (I24): la delega può essere annullata fino al terzultimo giorno lavorativo antecedente la data di addebito (Provv. AdE 26/07/2024 n. 313945, §5.3).</p></HelpTip>
                </>
              )}
              {saved?.paidOn && ` · pagato il ${formatDate(saved.paidOn)}`}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Saldo finale</p>
            <p className="font-mono text-lg tabular-nums">{formatMoney(Number(f.totalDebit) - Number(f.totalCredit ?? 0))}</p>
            {Number(f.totalCredit ?? 0) > 0 && <p className="text-xs text-muted-foreground">debiti {formatMoney(f.totalDebit)} − crediti {formatMoney(f.totalCredit ?? 0)}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinesTable lines={f.lines} section="TREASURY" taxYear={taxYear} />
        <LinesTable lines={f.lines} section="INPS" taxYear={taxYear} />
        <LinesTable lines={f.lines} section="REGIONAL" taxYear={taxYear} />
        <LinesTable lines={f.lines} section="LOCAL" taxYear={taxYear} />
        {saved && saved.status !== 'CANCELLED' && (
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <Button size="sm" variant="outline" render={<a href={`/f24/${saved.id}/pdf`} />}>Scarica PDF (Mod. F24)</Button>
            {saved.status !== 'PAID' && (
              <form action={setF24Status} className="flex items-end gap-2">
                <input type="hidden" name="id" value={saved.id} />
                <input type="hidden" name="taxYear" value={taxYear} />
                <input type="hidden" name="status" value="PAID" />
                <label className="text-xs text-muted-foreground">Data pagamento<Input type="date" name="paidOn" defaultValue={f.paymentDate.slice(0, 10)} className="mt-1 w-40" /></label>
                <Button type="submit" size="sm">Segna pagato</Button>
              </form>
            )}
            {saved.status === 'PLANNED' && (
              <form action={setF24Status}>
                <input type="hidden" name="id" value={saved.id} />
                <input type="hidden" name="taxYear" value={taxYear} />
                <input type="hidden" name="status" value="SCHEDULED_I24" />
                <Button type="submit" size="sm" variant="outline">Programmato con I24</Button>
              </form>
            )}
            {saved.status !== 'PLANNED' && (
              <form action={setF24Status}>
                <input type="hidden" name="id" value={saved.id} />
                <input type="hidden" name="taxYear" value={taxYear} />
                <input type="hidden" name="status" value="PLANNED" />
                <Button type="submit" size="sm" variant="ghost">Riporta a pianificato</Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
