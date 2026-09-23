'use client';

import Link from 'next/link';
import type { ReactElement } from 'react';
import { Eye, FileCode, FileDown, FileText, Pencil, Trash2 } from 'lucide-react';
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

/** Row actions of the invoice list: open, edit and delete for drafts; open (PDF in a new tab), download PDF and XML for issued documents. */
export function InvoiceRowActions({ id, status, hasXml }: { id: string; status: InvoiceStatus; hasXml: boolean }) {
  if (status === 'DRAFT') {
    return (
      <div className="flex justify-end gap-1">
        {/* Drafts have no number to click: the detail page is where they are issued. */}
        <Action label="Apri ed emetti" render={<Link href={`/invoices/${id}`} />}><FileText /></Action>
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
      <Action label="Anteprima (PDF)" render={<a href={`/invoices/${id}/pdf?inline=1`} target="_blank" rel="noreferrer" />}><Eye /></Action>
      <Action label="Scarica PDF" render={<a href={`/invoices/${id}/pdf`} />}><FileDown /></Action>
      {hasXml && <Action label="Scarica XML" render={<a href={`/invoices/${id}/xml`} />}><FileCode /></Action>}
    </div>
  );
}
