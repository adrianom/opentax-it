import { api } from '@/lib/api';

/** Proxies the invoice PDF download so the browser never needs the tenant header. */
export async function GET(_req: Request, { params }: RouteContext<'/invoices/[id]/pdf'>) {
  const { id } = await params;
  const { fileName, content } = await api.invoicePdf(id);
  return new Response(content, {
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${fileName}"` },
  });
}
