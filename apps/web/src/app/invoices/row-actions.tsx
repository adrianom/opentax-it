'use client';

import Link from 'next/link';
import type { ReactElement } from 'react';
import { Eye, FileCode, FileDown, Pencil, Trash2 } from 'lucide-react';
import { deleteInvoice } from '@/lib/actions';
import type { InvoiceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Icon button with a tooltip: a link when `render` is given, otherwise a native submit button. */
function Action({ label, render, children }: { label: string; render?: ReactElement; children: ReactElement }) {
  const button = render
    ? <Button variant="ghost" size="icon-sm" aria-label={label} render={render} />
    : <Button variant="ghost" size="icon-sm" aria-label={label} type="submit" />;
  return (
    <Tooltip>
      <TooltipTrigger render={button}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Row actions of the invoice list: edit and delete for drafts; preview, PDF and XML for issued documents. */
export function InvoiceRowActions({ id, status, hasXml }: { id: string; status: InvoiceStatus; hasXml: boolean }) {
  if (status === 'DRAFT') {
    return (
      <div className="flex justify-end gap-1">
        <Action label="Modifica" render={<Link href={`/invoices/${id}/edit`} />}><Pencil /></Action>
        <form action={deleteInvoice} onSubmit={(e) => { if (!window.confirm('Eliminare la bozza?')) e.preventDefault(); }}>
          <input type="hidden" name="id" value={id} />
          <Action label="Elimina bozza"><Trash2 /></Action>
        </form>
      </div>
    );
  }
  return (
    <div className="flex justify-end gap-1">
      <Action label="Anteprima" render={<Link href={`/invoices/${id}/preview`} />}><Eye /></Action>
      <Action label="Scarica PDF" render={<a href={`/invoices/${id}/pdf`} />}><FileDown /></Action>
      {hasXml && <Action label="Scarica XML" render={<a href={`/invoices/${id}/xml`} />}><FileCode /></Action>}
    </div>
  );
}
