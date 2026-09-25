'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { importInvoiceFiles, previewInvoiceImport } from '@/lib/actions';
import { formatDate, formatMoney } from '@/lib/format';
import type { ImportPreviewRow, ImportResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorAlert } from '@/components/error-alert';

const PREVIEW_LABELS: Record<ImportPreviewRow['status'], string> = { NEW: 'Da importare', DUPLICATE: 'Già presente', ERROR: 'Errore', IGNORED: 'Ignorato' };
const RESULT_LABELS: Record<ImportResult['status'], string> = { IMPORTED: 'Importata', SKIPPED: 'Già presente', ERROR: 'Errore' };
const variant = (status: string) => (status === 'ERROR' ? 'destructive' : status === 'NEW' || status === 'IMPORTED' ? 'secondary' : 'outline');

/**
 * Two steps on the same chosen files: "Analizza" shows what the import would do, without writing;
 * "Importa" sends the files again with the rows ticked by the user, and the API checks them again.
 */
export function ImportForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<ImportPreviewRow[]>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ImportResult[]>();

  const formData = (withSelection: boolean) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    if (withSelection) for (const s of selected) fd.append('selected', s);
    return fd;
  };

  const choose = (list: File[]) => {
    setFiles(list);
    setRows(undefined);
    setResults(undefined);
    setError(undefined);
  };

  const analyse = () => {
    setError(undefined);
    start(async () => {
      const res = await previewInvoiceImport(formData(false));
      if (res.error) return setError(res.error);
      setRows(res.rows);
      setSelected(new Set(res.rows?.filter((r) => r.status === 'NEW').map((r) => r.file)));
    });
  };

  const importSelected = () => {
    setError(undefined);
    start(async () => {
      const res = await importInvoiceFiles(formData(true));
      if (res.error) return setError(res.error);
      setResults(res.results);
      setRows(undefined);
    });
  };

  const selectable = rows?.filter((r) => r.status === 'NEW') ?? [];
  const toggle = (file: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(file);
      else next.delete(file);
      return next;
    });

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} />
      <div className="flex flex-wrap items-end gap-3">
        <Input type="file" accept=".xml,.zip,text/xml,application/xml,application/zip" multiple className="max-w-md" onChange={(e) => choose(Array.from(e.target.files ?? []))} />
        <Button variant={rows ? 'outline' : 'default'} onClick={analyse} disabled={pending || files.length === 0}>{pending && !rows ? 'Analisi…' : 'Analizza'}</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        File .xml FatturaPA o archivi .zip che li contengono (ad esempio scaricati dal portale Fatture e Corrispettivi), fino a 20 MB in totale.
        Le fatture firmate (.p7m) non sono ancora supportate. Il cedente deve essere la partita IVA attiva; i clienti mancanti vengono creati.
      </p>

      {rows && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    aria-label="Seleziona tutte"
                    checked={selectable.length > 0 && selected.size === selectable.length}
                    indeterminate={selected.size > 0 && selected.size < selectable.length}
                    disabled={selectable.length === 0}
                    onCheckedChange={(on) => setSelected(new Set(on ? selectable.map((r) => r.file) : []))}
                  />
                </TableHead>
                <TableHead>File</TableHead><TableHead>Esito</TableHead><TableHead>Numero</TableHead><TableHead>Data</TableHead><TableHead>Cliente / messaggio</TableHead><TableHead className="text-right">Totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {r.status === 'NEW' && <Checkbox aria-label={`Importa ${r.file}`} checked={selected.has(r.file)} onCheckedChange={(on) => toggle(r.file, on)} />}
                  </TableCell>
                  <TableCell className="font-mono text-xs break-all">{r.file}</TableCell>
                  <TableCell><Badge variant={variant(r.status)}>{PREVIEW_LABELS[r.status]}</Badge></TableCell>
                  <TableCell>{r.invoiceId ? <Link href={`/invoices/${r.invoiceId}`} className="font-mono hover:underline">{r.number}</Link> : (r.number ?? '—')}</TableCell>
                  <TableCell>{r.date ? formatDate(r.date) : '—'}</TableCell>
                  <TableCell className="text-sm">{r.status === 'NEW' ? r.customer : [r.customer, r.message].filter(Boolean).join(' · ')}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.total !== undefined ? formatMoney(r.total) : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end">
            <Button onClick={importSelected} disabled={pending || selected.size === 0}>
              {pending ? 'Importazione…' : `Importa ${selected.size} ${selected.size === 1 ? 'fattura' : 'fatture'}`}
            </Button>
          </div>
        </>
      )}

      {results && (
        <Table>
          <TableHeader><TableRow><TableHead>File</TableHead><TableHead>Esito</TableHead><TableHead>Numero</TableHead><TableHead>Cliente / messaggio</TableHead></TableRow></TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs break-all">{r.file}</TableCell>
                <TableCell><Badge variant={variant(r.status)}>{RESULT_LABELS[r.status]}</Badge></TableCell>
                <TableCell>{r.invoiceId ? <Link href={`/invoices/${r.invoiceId}`} className="font-mono hover:underline">{r.number}</Link> : (r.number ?? '—')}</TableCell>
                <TableCell className="text-sm">{r.customer ?? r.message ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
