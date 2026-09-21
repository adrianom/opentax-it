'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { importInvoiceFiles } from '@/lib/actions';
import type { ImportResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorAlert } from '@/components/error-alert';

const LABELS: Record<ImportResult['status'], string> = { IMPORTED: 'Importata', SKIPPED: 'Già presente', ERROR: 'Errore' };

export function ImportForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [results, setResults] = useState<ImportResult[]>();
  const [files, setFiles] = useState<File[]>([]);

  const submit = () => {
    setError(undefined);
    start(async () => {
      const payload = await Promise.all(files.map(async (f) => ({ name: f.name, xml: await f.text() })));
      const res = await importInvoiceFiles(payload);
      if (res.error) setError(res.error);
      else setResults(res.results);
    });
  };

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} />
      <div className="flex flex-wrap items-end gap-3">
        <Input type="file" accept=".xml,text/xml,application/xml" multiple className="max-w-md" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        <Button onClick={submit} disabled={pending || files.length === 0}>{pending ? 'Importazione…' : `Importa ${files.length || ''} file`}</Button>
      </div>
      <p className="text-xs text-muted-foreground">File .xml FatturaPA non firmati (i .p7m non sono supportati). Il cedente deve essere la partita IVA attiva; i documenti già presenti vengono saltati; i clienti mancanti vengono creati.</p>
      {results && (
        <Table>
          <TableHeader><TableRow><TableHead>File</TableHead><TableHead>Esito</TableHead><TableHead>Numero</TableHead><TableHead>Cliente / messaggio</TableHead></TableRow></TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.file}>
                <TableCell className="font-mono text-xs">{r.file}</TableCell>
                <TableCell><Badge variant={r.status === 'ERROR' ? 'destructive' : r.status === 'SKIPPED' ? 'outline' : 'secondary'}>{LABELS[r.status]}</Badge></TableCell>
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
