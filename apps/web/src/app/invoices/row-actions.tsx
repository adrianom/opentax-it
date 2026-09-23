'use client';

import Link from 'next/link';
import { Eye, FileCode, FileDown, FileText, Pencil } from 'lucide-react';
import { deleteInvoice } from '@/lib/actions';
import type { InvoiceStatus } from '@/lib/types';
import { DeleteRowAction, RowAction, RowActions } from '@/components/row-actions';

/** Row actions of the invoice list: open the detail on every row; edit and delete for drafts; preview (PDF in a new tab), download PDF and XML for issued documents. */
export function InvoiceRowActions({ id, status, hasXml }: { id: string; status: InvoiceStatus; hasXml: boolean }) {
  if (status === 'DRAFT') {
    return (
      <RowActions>
        <RowAction label="Apri" render={<Link href={`/invoices/${id}`} />}><FileText /></RowAction>
        <RowAction label="Modifica" render={<Link href={`/invoices/${id}/edit`} />}><Pencil /></RowAction>
        <DeleteRowAction action={deleteInvoice} fields={{ id }} label="Elimina bozza" confirm="Eliminare la bozza?" />
      </RowActions>
    );
  }
  return (
    <RowActions>
      <RowAction label="Apri" render={<Link href={`/invoices/${id}`} />}><FileText /></RowAction>
      <RowAction label="Anteprima (PDF)" render={<a href={`/invoices/${id}/pdf?inline=1`} target="_blank" rel="noreferrer" />}><Eye /></RowAction>
      <RowAction label="Scarica PDF" render={<a href={`/invoices/${id}/pdf`} />}><FileDown /></RowAction>
      {hasXml && <RowAction label="Scarica XML" render={<a href={`/invoices/${id}/xml`} />}><FileCode /></RowAction>}
    </RowActions>
  );
}
