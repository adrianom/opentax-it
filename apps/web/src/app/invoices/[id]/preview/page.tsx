import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, fetchOrNull, formatDate, formatMoney } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_LABELS, TYPE_LABELS } from '../../page';
import { PrintButton } from './print-button';

export default async function InvoicePreviewPage({ params }: PageProps<'/invoices/[id]/preview'>) {
  const { id } = await params;
  const inv = await fetchOrNull(() => api.invoicePreview(id));

  if (!inv) notFound();

  const isDraft = inv.isDraft;
  const docTitle = isDraft ? 'BOZZA – non valida ai fini fiscali' : (TYPE_LABELS[inv.documentType] ?? 'FATTURA');

  return (
    <div className="min-h-screen bg-muted/40 py-6 print:min-h-0 print:bg-white print:py-0">
      {/* Top action bar (hidden on print) */}
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href={`/invoices/${inv.id}`} />}>
            &larr; Torna al dettaglio
          </Button>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm font-medium">Anteprima {isDraft ? 'Bozza' : `${TYPE_LABELS[inv.documentType] ?? 'Fattura'} ${inv.number}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button render={<a href={`/invoices/${inv.id}/pdf`} />}>
            Scarica PDF
          </Button>
          {!isDraft && (
            <Button variant="outline" render={<a href={`/invoices/${inv.id}/xml`} />}>
              Scarica XML
            </Button>
          )}
        </div>
      </div>

      {/* A4 Printable Sheet Container */}
      <main className="mx-auto max-w-4xl rounded-lg border bg-white p-8 text-neutral-900 shadow-sm print:m-0 print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none md:p-12">
        {/* Header / Supplier & Document Metadata */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">{inv.supplier.name}</h1>
            <p className="text-xs text-neutral-600 font-medium italic">
              Regime Fiscale: {inv.supplier.taxRegime}{inv.supplier.taxRegime === 'RF19' ? ' - Regime forfettario' : ''}
            </p>
            <div className="space-y-0.5 text-xs text-neutral-600">
              <p>P.IVA: {inv.supplier.vatNumber || '-'} · C.F.: {inv.supplier.fiscalCode || '-'}</p>
              <p>{inv.supplier.address}, {inv.supplier.postalCode} {inv.supplier.city} ({inv.supplier.province}) - {inv.supplier.country}</p>
              {inv.supplier.pec && <p>PEC: {inv.supplier.pec}</p>}
            </div>
          </div>

          <div className="min-w-[180px] rounded-md border border-neutral-200 bg-neutral-50/50 p-4 text-right">
            <span className="inline-block text-sm font-bold uppercase tracking-wider text-blue-900">
              {docTitle}
            </span>
            <div className="mt-2 space-y-0.5 text-xs text-neutral-700">
              <p><span className="text-neutral-500">Numero:</span> <strong className="font-semibold">{inv.number || '(bozza)'}</strong></p>
              <p><span className="text-neutral-500">Data:</span> {formatDate(inv.date)}</p>
              <p><span className="text-neutral-500">Valuta:</span> {inv.currency}</p>
              <div className="pt-1">
                <Badge variant={isDraft ? 'outline' : 'secondary'} className="text-[10px]">
                  {STATUS_LABELS[inv.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-neutral-200" />

        {/* Customer Block */}
        <div className="rounded-md border border-neutral-200 bg-neutral-50/40 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Destinatario / Cliente</h2>
          <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
            <div className="space-y-0.5 text-xs">
              <p className="text-sm font-bold text-neutral-900">{inv.customer.name}</p>
              <p className="text-neutral-600">
                {inv.customer.address}, {inv.customer.postalCode || ''} {inv.customer.city} ({inv.customer.province || inv.customer.country})
              </p>
            </div>
            <div className="space-y-0.5 text-right text-xs text-neutral-600 sm:text-right">
              <p>P.IVA: {inv.customer.vatNumber || '-'} · C.F.: {inv.customer.fiscalCode || '-'}</p>
              <p>Codice Destinatario SDI: <span className="font-mono">{inv.customer.recipientCode}</span>{inv.customer.pec ? ` · PEC: ${inv.customer.pec}` : ''}</p>
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <div className="mt-6 overflow-hidden rounded-md border border-neutral-200">
          <Table>
            <TableHeader className="bg-neutral-100/70">
              <TableRow className="border-neutral-200 hover:bg-transparent">
                <TableHead className="w-10 text-xs font-semibold text-neutral-700">#</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700">Descrizione</TableHead>
                <TableHead className="text-right text-xs font-semibold text-neutral-700">Q.tà</TableHead>
                <TableHead className="text-right text-xs font-semibold text-neutral-700">Prezzo Unitario</TableHead>
                <TableHead className="text-right text-xs font-semibold text-neutral-700">IVA / Natura</TableHead>
                <TableHead className="text-right text-xs font-semibold text-neutral-700">Totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inv.lines?.map((l) => (
                <TableRow key={l.lineNumber} className="border-neutral-100 hover:bg-neutral-50/50">
                  <TableCell className="text-xs text-neutral-500">{l.lineNumber}</TableCell>
                  <TableCell className="text-xs font-medium text-neutral-900 whitespace-pre-line">{l.description}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-700">
                    {l.quantity !== undefined ? `${Number(l.quantity)} ${l.unit ?? ''}`.trim() : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-700">{formatMoney(l.unitPrice, inv.currency)}</TableCell>
                  <TableCell className="text-right text-xs text-neutral-500">0% {l.vatNature}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-neutral-900">{formatMoney(l.totalPrice, inv.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals & Payment Section */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Payment Info */}
          <div className="rounded-md border border-neutral-200 bg-neutral-50/30 p-4 text-xs">
            <h3 className="font-semibold uppercase tracking-wider text-neutral-500">Dati di Pagamento</h3>
            {inv.payment ? (
              <div className="mt-2 space-y-1 text-neutral-700">
                {inv.payment.method && (
                  <p><span className="text-neutral-500">Modalità:</span> {inv.payment.method === 'MP05' ? 'Bonifico bancario (MP05)' : inv.payment.method}</p>
                )}
                {inv.payment.dueDate && (
                  <p><span className="text-neutral-500">Scadenza:</span> <strong>{formatDate(inv.payment.dueDate)}</strong></p>
                )}
                {inv.payment.iban && (
                  <p><span className="text-neutral-500">IBAN:</span> <span className="font-mono font-semibold break-all">{inv.payment.iban}</span></p>
                )}
                {inv.payment.bic && (
                  <p><span className="text-neutral-500">BIC/SWIFT:</span> <span className="font-mono">{inv.payment.bic}</span></p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-neutral-500">Nessuna informazione di pagamento specificata.</p>
            )}
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col justify-end space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Imponibile:</span>
              <span className="font-mono">{formatMoney(inv.taxableAmount, inv.currency)}</span>
            </div>
            {Number(inv.inpsSurcharge) > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Rivalsa INPS {inv.inpsRatePct ? `${inv.inpsRatePct}%` : ''}:</span>
                <span className="font-mono">{formatMoney(inv.inpsSurcharge, inv.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>IVA (0%):</span>
              <span className="font-mono">0,00 {inv.currency}</span>
            </div>
            {inv.virtualStamp && (
              <div className="flex justify-between text-neutral-600">
                <span>Bollo virtuale:</span>
                <span className="font-mono">{formatMoney(inv.stampAmount, inv.currency)}</span>
              </div>
            )}
            <Separator className="my-1 bg-neutral-200" />
            <div className="flex items-center justify-between rounded bg-neutral-100 p-2 text-sm font-bold text-neutral-900">
              <span>TOTALE DOCUMENTO:</span>
              <span className="font-mono text-base">{formatMoney(inv.total, inv.currency)}</span>
            </div>
          </div>
        </div>

        {/* Legal Notes & Annotations */}
        {inv.notes && inv.notes.length > 0 && (
          <div className="mt-8 rounded-md border border-neutral-200 bg-neutral-50/50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Diciture di Legge e Annotazioni</h3>
            <ul className="mt-2 space-y-1 text-xs text-neutral-700">
              {inv.notes.map((n, i) => (
                <li key={i} className="leading-relaxed">• {n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Courtesy Disclaimer Footer */}
        <div className="mt-12 border-t border-neutral-200 pt-4 text-center text-[10px] text-neutral-400">
          <p>Copia di cortesia. L&apos;originale è il file XML trasmesso tramite il Sistema di Interscambio.</p>
        </div>
      </main>
    </div>
  );
}
