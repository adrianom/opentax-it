import type { ReactNode } from 'react';
import { api, currentTenantId, fetchOrNull } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export async function AppShell({ children }: { children: ReactNode }) {
  const tenantId = await currentTenantId();
  const tenants = (await fetchOrNull(() => api.tenants())) ?? [];
  const tenant = tenants.find((t) => t.id === tenantId) ?? null;
  return (
    <SidebarProvider>
      <AppSidebar tenantName={tenant?.name ?? null} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{tenant ? tenant.name : 'Seleziona una partita IVA'}</span>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
