import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HelpTip } from '@/components/help-tip';
import { setF24Status } from '@/lib/actions';
import { formatDate, formatMoney, type F24, type F24Draft, type F24Line } from '@/lib/api';

const STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PLANNED: { label: 'Pianificato', variant: 'outline' },
  SCHEDULED_I24: { label: 'I24 programmato', variant: 'secondary' },
  PAID: { label: 'Pagato', variant: 'default' },
  CANCELLED: { label: 'Annullato', variant: 'destructive' },
};

export function f24Title(f: F24Draft): string {
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
    default: return l.description ?? '';
  }
}

function LinesTable({ lines, section, taxYear }: { lines: F24Line[]; section: 'TREASURY' | 'INPS'; taxYear: number }) {
  const rows = lines.filter((l) => l.section === section);
  if (rows.length === 0) return null;
  const treasury = section === 'TREASURY';
  return (
    <div className="overflow-x-auto">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{treasury ? 'Sezione Erario' : 'Sezione INPS'}</p>
      <Table>
        <TableHeader>
          <TableRow>
            {treasury ? (
              <>
                <TableHead>Codice tributo</TableHead>
                <TableHead>Rateazione</TableHead>
                <TableHead>Anno di riferimento</TableHead>
              </>
            ) : (
              <>
                <TableHead>Codice sede</TableHead>
                <TableHead>Causale</TableHead>
                <TableHead>Periodo da</TableHead>
                <TableHead>a</TableHead>
              </>
            )}
            <TableHead className="text-right">Importo a debito</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l, i) => (
            <TableRow key={l.id ?? `${l.code}-${l.referenceYear}-${i}`}>
              {treasury ? (
                <>
                  <TableCell className="font-mono">{l.code}<span className="ml-2 font-sans text-xs text-muted-foreground">{lineLabel(l, taxYear)}</span></TableCell>
                  <TableCell className="font-mono">{l.installmentCode ?? ''}</TableCell>
                  <TableCell className="font-mono">{l.referenceYear}</TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-mono">{l.officeCode}</TableCell>
                  <TableCell className="font-mono">{l.code}<span className="ml-2 font-sans text-xs text-muted-foreground">{lineLabel(l, taxYear)}</span></TableCell>
                  <TableCell className="font-mono">{l.periodFrom}</TableCell>
                  <TableCell className="font-mono">{l.periodTo}</TableCell>
                </>
              )}
              <TableCell className="text-right font-mono tabular-nums">{formatMoney(l.debitAmount)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={treasury ? 3 : 4} className="text-right text-xs text-muted-foreground">Totale sezione</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatMoney(rows.reduce((s, l) => s + Number(l.debitAmount), 0))}</TableCell>
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
            <p className="font-mono text-lg tabular-nums">{formatMoney(f.totalDebit)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinesTable lines={f.lines} section="TREASURY" taxYear={taxYear} />
        <LinesTable lines={f.lines} section="INPS" taxYear={taxYear} />
        {saved && saved.status !== 'CANCELLED' && (
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
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
