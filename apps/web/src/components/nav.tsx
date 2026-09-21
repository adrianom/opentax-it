import Link from 'next/link';
import { api, currentTenantId, fetchOrNull } from '@/lib/api';

export async function Nav() {
  const tenantId = await currentTenantId();
  const tenants = (await fetchOrNull(() => api.tenants())) ?? [];
  const tenant = tenants.find((t) => t.id === tenantId);
  const links = [
    ['/invoices', 'Fatture'],
    ['/customers', 'Clienti'],
    ['/deadlines', 'Scadenzario'],
  ];
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="font-semibold">OpenTax IT</Link>
        <nav className="flex gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-muted-foreground hover:text-foreground">{label}</Link>
          ))}
        </nav>
        <div className="ml-auto text-sm">
          <Link href="/setup" className="text-muted-foreground hover:text-foreground">
            {tenant ? tenant.name : 'Seleziona partita IVA'}
          </Link>
        </div>
      </div>
    </header>
  );
}
