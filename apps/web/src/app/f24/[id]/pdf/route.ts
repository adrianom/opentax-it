import { api } from '@/lib/api';

/** Proxies the PDF download so the browser never needs the tenant header. */
export async function GET(_req: Request, { params }: RouteContext<'/f24/[id]/pdf'>) {
  const { id } = await params;
  const { fileName, content } = await api.f24Pdf(id);
  return new Response(content, {
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${fileName}"` },
  });
}
